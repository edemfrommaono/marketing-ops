import { redirect } from "next/navigation";

// Root "/" → toujours vers la page de login
// Le middleware redirigera vers /strategy après authentification réussie
export default function Home() {
  redirect("/auth/login");
}
