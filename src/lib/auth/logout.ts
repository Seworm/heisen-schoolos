"use server";

import { redirect } from "next/navigation";
import { signOutApplication } from "./compat";

export async function logout() {
  await signOutApplication();
  redirect("/login");
}
