---
trigger: always_on
---

Whenever you create a hook for fetching,mutating data make sure to

- create the file with the entity name in api dir Ex api/notifications.ts
- Create the type of the entity in types dir types/notifications.ts
- use tanstack query either as useQuery or useMutation
- when you consume the useQuery hook don't rename the data variable to the plural of entity name for example notifications

Whenever you create a dummy data create it in a folder called \_mock/entityName.ts for example \_mock/notifications.ts

Whenever you design a skeleton for small component create it in the small component file but with a different function for exmaple. <NotificationItemSkeleton/> but if you creating a loading state for the whole view create the file in /views dir with name loading-view.tsx a loading-view can contain 2 functions (or more if required) one for list and one for details

- Whenever you design empty-state component create it in empty-view component in the views directory and for small components create it in the same file but different Function and always make the component localized in both languages and support both light and dark mode
