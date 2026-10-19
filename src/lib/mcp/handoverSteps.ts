/** get_handover_steps: the six steps of /leasingvertrag-uebertragen for passing on a lease, plus the links. */
import { rejectUnknownKeys, type Args } from "@/lib/mcp/args";
import { siteUrl } from "@/lib/mcp/listingOutput";
import { toolResult, type JsonSchema } from "@/lib/mcp/protocol";

export const HANDOVER_OUTPUT_SCHEMA: JsonSchema = {
  type: "object",
  properties: {
    steps: {
      type: "array",
      items: {
        type: "object",
        properties: {
          step: { type: "integer" },
          title_de: { type: "string" },
          title_en: { type: "string" },
          what_to_do: { type: "string" },
        },
        required: ["step", "title_de", "title_en", "what_to_do"],
      },
    },
    listing_form: { type: "array", items: { type: "string" } },
    create_listing_url: { type: "string" },
    guide_url: { type: "string" },
    other_exit_options_url: { type: "string" },
    prices_url: { type: "string" },
    notes: { type: "array", items: { type: "string" } },
  },
  required: ["steps", "listing_form", "create_listing_url", "guide_url", "other_exit_options_url", "prices_url", "notes"],
};

export function runHandoverSteps(args: Args) {
  rejectUnknownKeys(args, [], "get_handover_steps");
  return toolResult({
    steps: [
      {
        step: 1,
        title_de: "Vertrag prüfen",
        title_en: "Check the contract",
        what_to_do:
          "Note the monthly rate, the contract end (remaining term), the agreed kilometres and current mileage, and what the contract says about transferring it. The leasing company has to agree to a transfer.",
      },
      {
        step: 2,
        title_de: "Leasinggesellschaft anfragen und Gebühr klären",
        title_en: "Ask the leasing company and clarify the fee",
        what_to_do:
          "Tell the leasing company you want to transfer the contract and ask about the process and the fee (published fees: get_takeover_costs). Agree in writing with the person taking over who pays the fee.",
      },
      {
        step: 3,
        title_de: "Inserat auf BuyAuto erstellen",
        title_en: "Create the listing on BuyAuto",
        what_to_do:
          "Enter the monthly rate and contract end, whether you ask for a deposit (Kaution) and, if you like, the kilometres left. Interested people then message you through BuyAuto.",
      },
      {
        step: 4,
        title_de: "Die Leasinggesellschaft prüft die übernehmende Person",
        title_en: "The leasing company checks the person taking over",
        what_to_do:
          "The person taking over applies to your leasing company, which checks their creditworthiness (including ZEK and IKO) and decides whether it agrees. Until the contract is rewritten you remain the lessee and pay the rates.",
      },
      {
        step: 5,
        title_de: "Vertrag umschreiben, neuer Fahrzeugausweis",
        title_en: "Contract rewritten, new registration document",
        what_to_do:
          "Once the leasing company agrees, it rewrites the contract to the new person; get the start date confirmed in writing. The road traffic office issues a new Fahrzeugausweis to the new person; new plates only if they have none.",
      },
      {
        step: 6,
        title_de: "Auto übergeben, mit Protokoll",
        title_en: "Hand over the car with a handover report",
        what_to_do:
          "Hand over the car once the written consent is there and the contract is rewritten. Record date, mileage, damage (with photos), keys, service book and accessories in a report you both sign. Ask your insurer when your policy ends and the road traffic office about your plates.",
      },
    ],
    listing_form: [
      "Fahrzeugdaten (vehicle data)",
      "Leasingdetails: monthly rate, contract end or remaining months, deposit (Kaution), kilometres left (optional)",
      "Plan (see prices_url)",
      "Photos",
      "Preview and publish; private sellers without an account sign in or register at this last step, garages list from a garage account",
    ],
    create_listing_url: siteUrl("/inserat-erstellen"),
    guide_url: siteUrl("/leasingvertrag-uebertragen"),
    other_exit_options_url: siteUrl("/leasing-abgeben-schweiz"),
    prices_url: siteUrl("/preise"),
    notes: [
      "This connector cannot create a listing: the seller fills in the form at create_listing_url.",
      "guide_url has these steps with their sources; other_exit_options_url covers early termination and buying out, with an exit calculator.",
    ],
  });
}
