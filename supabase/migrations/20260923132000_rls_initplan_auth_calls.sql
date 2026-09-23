-- Wrap auth.uid()/role()/jwt()/email() in (select ...) inside every public
-- RLS policy so Postgres evaluates them once per query, not once per row
-- (advisor: auth_rls_initplan). Semantics are unchanged. Idempotent: calls that
-- are already wrapped are left alone.
-- Rollback: re-create the policies from the earlier migrations.

do $$
declare
  pol record;
  new_using text;
  new_check text;
  stmt text;
  -- Postgres stores wrapped calls as "( SELECT auth.uid() AS uid)", so the
  -- lookbehinds skip calls already preceded by SELECT (plus up to 2 parens).
  pat constant text := '(?<!select )(?<!select \()(?<!select \(\()(auth\.(uid|role|jwt|email)\(\))';
begin
  for pol in
    select schemaname, tablename, policyname, qual, with_check
    from pg_policies
    where schemaname = 'public'
      and (coalesce(qual, '') ~ 'auth\.(uid|role|jwt|email)\(\)'
        or coalesce(with_check, '') ~ 'auth\.(uid|role|jwt|email)\(\)')
  loop
    new_using := regexp_replace(pol.qual, pat, '(select \1)', 'gi');
    new_check := regexp_replace(pol.with_check, pat, '(select \1)', 'gi');

    if new_using is not distinct from pol.qual
       and new_check is not distinct from pol.with_check then
      continue;
    end if;

    stmt := format('alter policy %I on %I.%I', pol.policyname, pol.schemaname, pol.tablename);
    if pol.qual is not null then
      stmt := stmt || format(' using (%s)', new_using);
    end if;
    if pol.with_check is not null then
      stmt := stmt || format(' with check (%s)', new_check);
    end if;
    execute stmt;
  end loop;
end
$$;
