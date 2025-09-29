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

  // Normalize paths by removing trailing slashes (except for root '/')
  const normalizeePath = (path: string) => path === '/' ? '/' : path.replace(/\/$/, '');
  const normalizedCurrentPath = normalizeePath(currentPath);
  const normalizedTargetPath = normalizeePath(targetPath);

  const isActive = exact
    ? normalizedCurrentPath === normalizedTargetPath
    : normalizedCurrentPath === normalizedTargetPath || (normalizedTargetPath !== '/' && normalizedCurrentPath.startsWith(normalizedTargetPath + '/'));

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
