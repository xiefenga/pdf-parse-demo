import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import 'react-json-pretty/themes/monikai.css';

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}
