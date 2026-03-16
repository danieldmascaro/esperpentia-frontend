import { ShoppingCart, UserRound } from "lucide-react"
import { Link, NavLink, useNavigate } from "react-router-dom"

import { useAuth } from "@/auth/useAuth"
import { useCart } from "@/commerce/useCart"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLogout } from "@/hooks/useLogout"

const links = [
  { to: "/", label: "Inicio" },
  { to: "/catalogo", label: "Catalogo" },
]

export function MainHeader() {
  const { isAuthenticated, user } = useAuth()
  const { cartCount } = useCart()
  const { logout } = useLogout()
  const navigate = useNavigate()
  const userGreeting = user?.nombre ? `Hola, ${user.nombre}` : user?.email

  return (
    <header className="w-full border-b border-white/10 bg-black text-white">
      <div className="mx-auto flex h-16 w-full max-w-[90rem] items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex flex-col leading-none">
          <span className="text-sm font-semibold tracking-wide uppercase">Esperpentia</span>
          {isAuthenticated && userGreeting ? (
            <span className="mt-1 text-xs text-zinc-400">{userGreeting}</span>
          ) : null}
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `transition-colors ${isActive ? "text-white" : "text-zinc-400 hover:text-zinc-200"}`
              }
            >
              {link.label}
            </NavLink>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link to="/checkout" />}
            className="gap-2 border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
          >
            <ShoppingCart className="size-4" />
            Carrito
            <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-black">
              {cartCount}
            </span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white focus-visible:text-white"
                  aria-label="Opciones de usuario"
                >
                  <UserRound className="size-4" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-44 bg-black text-white ring-white/10">
              {isAuthenticated ? (
                <>
                  <DropdownMenuItem
                    className="justify-center text-center text-white focus:bg-white/10 focus:text-white"
                    onClick={() => navigate("/cuenta")}
                  >
                    Cuenta
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem
                    className="flex justify-center p-0 focus:bg-transparent"
                  >
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="mx-auto justify-center bg-destructive px-4 !text-white hover:bg-destructive/90 hover:!text-white focus-visible:border-destructive/40 focus-visible:ring-destructive/20 focus-visible:!text-white"
                      onClick={logout}
                    >
                      Cerrar sesion
                    </Button>
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem
                    className="justify-center text-center text-white focus:bg-white/10 focus:text-white"
                    onClick={() => navigate("/login")}
                  >
                    Iniciar sesion
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem
                    className="justify-center text-center text-white focus:bg-white/10 focus:text-white"
                    onClick={() => navigate("/registro")}
                  >
                    Registrarse
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
    </header>
  )
}
