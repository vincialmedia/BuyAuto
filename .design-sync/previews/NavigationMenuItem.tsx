import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from 'buyauto';

// NavigationMenuItem is an <li> in the nav list. The dropdown viewport only
// mounts on open, so the closed bar of links is what a static card can show —
// and it is what the site header renders most of the time anyway.
//
// NavigationMenuLink carries almost no styling by itself: the padding, height
// and hover treatment come from navigationMenuTriggerStyle(), which the app
// applies at every call site. Without it the links render as bare text run
// together, which is exactly how the first attempt at this card looked.
export function InNavBar() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        {['Fahrzeuge suchen', 'Leasing abgeben', 'Preise', 'Für Garagen'].map((label) => (
          <NavigationMenuItem key={label}>
            <NavigationMenuLink href="#" className={navigationMenuTriggerStyle()}>
              {label}
            </NavigationMenuLink>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
}

// `active` marks the current section.
export function WithActiveItem() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        {[
          { label: 'Fahrzeuge suchen', active: true },
          { label: 'Leasing abgeben', active: false },
          { label: 'Preise', active: false },
        ].map((item) => (
          <NavigationMenuItem key={item.label}>
            <NavigationMenuLink
              href="#"
              active={item.active}
              className={navigationMenuTriggerStyle()}
            >
              {item.label}
            </NavigationMenuLink>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
