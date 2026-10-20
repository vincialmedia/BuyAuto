/**
 * Checks for the site-wide schema.org entities (src/lib/buyauto/entities.ts):
 * `npx tsx scripts/test-entities.ts`. The Organization carries only what /impressum
 * says, and the founder's name matches FOUNDER_TAKEOVER. Exits non-zero on failure.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  FOUNDER_NAME,
  FOUNDER_PERSON_ID,
  FOUNDER_REF,
  ORGANIZATION_ADDRESS,
  ORGANIZATION_EMAIL,
  ORGANIZATION_ID,
  ORGANIZATION_JSON_LD,
  ORGANIZATION_REF,
} from "../src/lib/buyauto/entities";
import { FOUNDER_TAKEOVER } from "../src/lib/buyauto/facts";

assert.equal(ORGANIZATION_ID, "https://www.buyauto.ch/#organization");
assert.equal(FOUNDER_PERSON_ID, "https://www.buyauto.ch/#vincent-haenggi");
assert.deepEqual(ORGANIZATION_REF, { "@id": ORGANIZATION_ID });
assert.deepEqual(FOUNDER_REF, { "@id": FOUNDER_PERSON_ID });
assert.equal(FOUNDER_NAME, FOUNDER_TAKEOVER.person, "same name as the founder facts");

assert.equal(ORGANIZATION_JSON_LD["@id"], ORGANIZATION_ID);
assert.equal(ORGANIZATION_JSON_LD.founder["@id"], FOUNDER_PERSON_ID, "founder names the Person @id");
assert.ok(!("sameAs" in ORGANIZATION_JSON_LD), "no empty sameAs");
const json = JSON.stringify(ORGANIZATION_JSON_LD);
assert.ok(!json.includes("undefined") && !json.includes("[]"), "no empty values");

// Every operator detail in the node is printed on /impressum.
const impressum = fs.readFileSync(path.join(__dirname, "..", "src", "pages", "impressum.tsx"), "utf8");
assert.ok(impressum.includes(`>${ORGANIZATION_ADDRESS.streetAddress}<`), "street as on the Impressum");
assert.ok(impressum.includes(`>${ORGANIZATION_ADDRESS.postalCode} ${ORGANIZATION_ADDRESS.addressLocality}`), "postcode and place");
assert.ok(impressum.includes(">Schweiz<") && ORGANIZATION_ADDRESS.addressCountry === "CH", "country");
assert.ok(impressum.includes(`mailto:${ORGANIZATION_EMAIL}`), "e-mail as on the Impressum");
assert.ok(impressum.includes(`>${FOUNDER_NAME}<`), "operator name");

console.log("test-entities: all assertions passed");
