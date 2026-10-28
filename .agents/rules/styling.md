---
trigger: always_on
---

-whenever you style a component take into consideration dark mode
Don't just create styles using Stylesheet.create but create a function called createStyles that takes in theme which is the returntype of useTheme and return styles that way you can style with theme aware.

-Don't use terinary for dark mode styling but use theme variables to define a color for dark and it's equivalent for light mode
