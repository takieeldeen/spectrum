---
trigger: always_on
---

- Whenever I provide you with a static arabic text or a screenshot with arabic text or english text that requires translation (Static text) Ex. Current Consumption, Watt, and so on. Don't use terinary operators to switch between arabic and english no use the @ar.json and @en.json files to implement the translation using t("YOUR_KEY").

- Whenever you add a new key in ar.json and en.json add them under thier corresponding tab for example if we are wokring on Notifications tab and you will add a PAGE_TITLE key then add it under the namesapace NOTIFICATIONS so it will be NOTIFICATIONS: {"PAGE_TITLE":"Notifications"}

- Don't use isRtl ? "row-reverse" : "row" just make it "row" and the rtl layout will handle it automatically
