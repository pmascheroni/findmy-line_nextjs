import "./globals.css";
import Providers from "@/lib/Providers";
import AppLayout from "@/components/AppLayout";

export const metadata = {
  title: "FindMyLine",
  description: "Compare odds across sportsbooks and prediction markets.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <AppLayout>{children}</AppLayout>
        </Providers>
      </body>
    </html>
  );
}
