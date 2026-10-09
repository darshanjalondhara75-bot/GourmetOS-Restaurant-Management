import { RegisterView } from "@/components/RegisterView";
import { Metadata } from "next";
import { BRAND_NAME } from "@/lib/branding";

export const metadata: Metadata = {
  title: `Register Staff Account | ${BRAND_NAME}`,
  description: `Create a staff account for ${BRAND_NAME} Restaurant Management System`,
};

export default function RegisterPage() {
  return <RegisterView />;
}
