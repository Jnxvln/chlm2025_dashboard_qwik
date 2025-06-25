import { Slot, component$ } from '@builder.io/qwik';
import { Link, useLocation, type LinkProps } from '@builder.io/qwik-city';

type NavLinkProps = LinkProps & { activeClass?: string };

export const NavLink = component$(({ activeClass, ...props }: NavLinkProps) => {
  const location = useLocation();
  const currentPath = location.url.pathname;
  const targetPath = props.href ?? '';

  const isActive =
    currentPath === targetPath ||
    (targetPath !== '/' && currentPath.startsWith(targetPath + '/'));

  return (
    <Link
      {...props}
      class={[props.class, isActive && activeClass ? activeClass : '']}
    >
      <Slot />
    </Link>
  );
});
