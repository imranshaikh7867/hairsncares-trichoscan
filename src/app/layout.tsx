import type { Metadata } from "next";
import { Geist, Geist_Mono, Roboto } from "next/font/google";
import "./globals.css";
import ReduxProvider from "@/redux/providers";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/*
  The TrichoScan report stylesheet asks for Roboto on roughly 260 rules, but the
  font was never loaded and `body` had no font-family of its own — so every
  element the stylesheet did not name explicitly (the header's Back link, the
  report-id and date chips) rendered in the browser's default serif next to
  Roboto body copy. That is the header "theme mismatch".
*/
const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hair Loss Test Online | Free Hair Diagnosis Test",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${roboto.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <CartProvider>
          <ReduxProvider>{children}</ReduxProvider>
          </CartProvider>
        </AuthProvider>
        {/*
          The app calls toast.* about thirty-five times — every validation
          message, every network failure, every "redirecting" notice. Without a
          container mounted here each of those calls does nothing at all, so a
          failed unlock looked to the user like a button that simply did not work.
        */}
        <ToastContainer
          position="top-right"
          autoClose={5000}
          newestOnTop
          closeOnClick
          pauseOnHover
          theme="dark"
        />
        <div id="recaptcha-container" />
      </body>
    </html>
  );
}
