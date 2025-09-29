import { Slot, component$ } from '@builder.io/qwik';
import { Link, useLocation, type LinkProps } from '@builder.io/qwik-city';

type NavLinkProps = LinkProps & {
  activeClass?: string;
  activeStyle?: string;
  exact?: boolean;
};

export const NavLink = component$(({ activeClass, activeStyle, exact, ...props }: NavLinkProps) => {
  const location = useLocation();
  const currentPath = location.url.pathname;
  const targetPath = props.href ?? '';

  const isActive = exact
    ? currentPath === targetPath
    : currentPath === targetPath || (targetPath !== '/' && currentPath.startsWith(targetPath + '/'));

  return (
    <Link
      {...props}
      class={[props.class, isActive && activeClass ? activeClass : '']}
      style={isActive && activeStyle ? activeStyle : props.style}
    >
      <Slot />
    </Link>
  );
});
