// One courier fee covers a whole parcel; mirrors COURIER_FEE_CENTS in
// create-rental-courier-checkout.
export const RENTAL_COURIER_FEE = 3

// The rental rules' reasons (insert trigger, claim_rentals or the paid-courier
// check), in the member's words.
export function toRentalErrorMessage(reason: string): string {
  if (reason.includes("paused")) {
    return "Prenumerata pristabdyta – atnaujink ją paskyroje, kad galėtum nuomotis."
  }
  if (reason.includes("exceeds the plan budget")) {
    return "Šiam rinkiniui neužtenka briksių šiam atsiskaitymo laikotarpiui."
  }
  if (reason.includes("full address")) {
    return "Pristatymui į duris reikia vardo, telefono ir pilno adreso."
  }
  if (reason.includes("fully rented out")) {
    return "Šis rinkinys šiuo metu yra išnuomotas kitam nariui."
  }
  if (reason.includes("does not include")) {
    return "Tavo prenumerata neapima vieno iš krepšelio rinkinių."
  }
  if (reason.includes("ends too soon")) {
    return "Prenumerata greitai baigiasi – naujų nuomų pradėti nebegalima."
  }
  if (reason.includes("Home delivery is not enabled")) {
    return "Tavo prenumerata neapima pristatymo į duris. Pasirink paštomatą."
  }
  return "Užsakymo pateikti nepavyko. Bandyk dar kartą arba susisiek su mumis."
}
