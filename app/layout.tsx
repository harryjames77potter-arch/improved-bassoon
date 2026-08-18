export const metadata = {
  title: "Amazon Price Alert",
  description: "Get an email twice a day with the current price of one Amazon product.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
