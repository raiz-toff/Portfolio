import { blog } from '@/lib/blog';
import { notFound } from 'next/navigation';
import { ImageResponse } from 'next/og';
import { generate as DefaultImage } from 'fumadocs-ui/og';

export const revalidate = false;

// Social card for posts without a `cover` — violet to match the blog accent.
export async function GET(_req: Request, { params }: RouteContext<'/og/blog/[slug]'>) {
  const { slug } = await params;
  const page = blog.getPage([slug]);
  if (!page) notFound();

  return new ImageResponse(
    <DefaultImage
      title={page.data.title}
      description={page.data.description}
      site="Rajkumar's Blog"
      primaryColor="#7c3aed"
      primaryTextColor="#a78bfa"
    />,
    {
      width: 1200,
      height: 630,
    },
  );
}

export function generateStaticParams() {
  return blog.getPages().map((page) => ({ slug: page.slugs[0] }));
}
