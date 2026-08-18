import { redirect } from 'next/navigation';

export default function Home() {
  // Siteye kök adresten (/) giren herkesi anında login sayfasına fırlatır.
  redirect('/login');
}