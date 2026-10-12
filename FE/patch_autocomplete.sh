sed -i '' -e '/import { useCreatePlug } from/a\
import { useGetUnassignedDevices } from "src/api/device";\
' src/sections/plugs/plug-new-edit-form.tsx
