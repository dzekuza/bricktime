import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export function Settings() {
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [newSubscriberAlert, setNewSubscriberAlert] = useState(true)
  const [overdueAlert, setOverdueAlert] = useState(true)
  const [savedGeneral, setSavedGeneral] = useState(false)
  const [savedNotifications, setSavedNotifications] = useState(false)

  function handleSaveGeneral() {
    setSavedGeneral(true)
    setTimeout(() => setSavedGeneral(false), 2000)
  }

  function handleSaveNotifications() {
    setSavedNotifications(true)
    setTimeout(() => setSavedNotifications(false), 2000)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm">Manage your account and preferences.</p>
      </div>

      <Tabs defaultValue="general" className="flex flex-col gap-4">
        <TabsList className="w-fit">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        {/* General */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General</CardTitle>
              <CardDescription>Basic store and account information.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <Avatar className="size-16">
                  <AvatarFallback className="text-lg">DZ</AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-1">
                  <p className="font-medium text-sm">dzekuza</p>
                  <p className="text-xs text-muted-foreground">dzekuza@gmail.com</p>
                  <Button variant="outline" size="sm" className="mt-1 w-fit">Change avatar</Button>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="storeName">Store name</Label>
                  <Input id="storeName" defaultValue="BRICKTIME" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="supportEmail">Support email</Label>
                  <Input id="supportEmail" type="email" defaultValue="hello@bricktime.co" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="currency">Currency</Label>
                  <Input id="currency" defaultValue="EUR (€)" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Input id="timezone" defaultValue="Europe/Vilnius" />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button onClick={handleSaveGeneral}>
                  {savedGeneral ? 'Saved!' : 'Save changes'}
                </Button>
                {savedGeneral && (
                  <Badge variant="outline" className="text-green-600 border-green-200">Changes saved</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Choose which events trigger an email alert.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              {[
                { id: 'email', label: 'Email notifications', description: 'Receive notifications via email.', value: emailNotifications, onChange: setEmailNotifications },
                { id: 'new-sub', label: 'New subscriber', description: 'Alert when someone subscribes.', value: newSubscriberAlert, onChange: setNewSubscriberAlert },
                { id: 'overdue', label: 'Overdue rentals', description: 'Alert when an order passes its due date.', value: overdueAlert, onChange: setOverdueAlert },
              ].map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-4">
                  <div className="flex flex-col gap-0.5">
                    <Label htmlFor={item.id} className="font-medium">{item.label}</Label>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <Switch
                    id={item.id}
                    checked={item.value}
                    onCheckedChange={item.onChange}
                  />
                </div>
              ))}
              <div className="flex items-center gap-3 pt-2">
                <Button onClick={handleSaveNotifications}>
                  {savedNotifications ? 'Saved!' : 'Save changes'}
                </Button>
                {savedNotifications && (
                  <Badge variant="outline" className="text-green-600 border-green-200">Changes saved</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team */}
        <TabsContent value="team">
          <Card>
            <CardHeader>
              <CardTitle>Team</CardTitle>
              <CardDescription>Manage who has access to this admin panel.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              {[
                { name: 'dzekuza', email: 'dzekuza@gmail.com', role: 'Owner' },
              ].map((member) => (
                <div key={member.email} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-9">
                      <AvatarFallback className="text-xs">
                        {member.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-0.5">
                      <p className="text-sm font-medium">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  <Badge variant="outline">{member.role}</Badge>
                </div>
              ))}

              <Separator />

              <div className="flex flex-col gap-3">
                <p className="text-sm font-medium">Invite a team member</p>
                <div className="flex gap-2">
                  <Input placeholder="colleague@example.com" className="flex-1" />
                  <Button variant="outline">Invite</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing */}
        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>Billing</CardTitle>
              <CardDescription>Your current plan and payment details.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div className="rounded-lg border p-4 flex items-center justify-between gap-4">
                <div className="flex flex-col gap-0.5">
                  <p className="font-medium text-sm">BRICKTIME Admin — Pro</p>
                  <p className="text-xs text-muted-foreground">Renews June 1, 2026 · €49/mo</p>
                </div>
                <Badge variant="outline" className="text-green-600 border-green-200">Active</Badge>
              </div>

              <div className="rounded-lg border p-4 flex items-center justify-between gap-4">
                <div className="flex flex-col gap-0.5">
                  <p className="font-medium text-sm">Payment method</p>
                  <p className="text-xs text-muted-foreground">Visa ending in 4242</p>
                </div>
                <Button variant="outline" size="sm">Update</Button>
              </div>

              <Separator />

              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">Danger zone</p>
                <p className="text-xs text-muted-foreground mb-2">This will cancel your subscription at the end of the current period.</p>
                <Button variant="outline" className="w-fit text-destructive border-destructive/30 hover:bg-destructive/5">
                  Cancel plan
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
