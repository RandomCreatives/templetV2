'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { MUTED_GRAY_BLUR_DATA_URL, PROJECT_COVER_IMAGE_SIZES } from '@/lib/image';
import type { Project } from '@/lib/types';

function ProjectCover({ project, priority }: { project: Project; priority: boolean }) {
  const [hasFailed, setHasFailed] = useState(false);
  const hasCover = Boolean(project.coverImageUrl && /\.(avif|webp|jpe?g|png|svg)$/i.test(project.coverImageUrl));

  if (!hasCover || hasFailed) {
    return (
      <div
        className="mb-2 grid aspect-[4/3] w-full select-none place-items-center bg-gray-200 p-4 text-center font-mono text-[11px] uppercase tracking-[0.12em] text-gray-600"
        onContextMenu={(event) => event.preventDefault()}
      >
        {project.title}
      </div>
    );
  }

  return (
    <div className="relative mb-2 aspect-[4/3] w-full bg-gray-200" onContextMenu={(event) => event.preventDefault()}>
      <Image
        src={project.coverImageUrl}
        alt=""
        fill
        priority={priority}
        sizes={PROJECT_COVER_IMAGE_SIZES}
        placeholder="blur"
        blurDataURL={MUTED_GRAY_BLUR_DATA_URL}
        onError={() => setHasFailed(true)}
        onContextMenu={(event) => event.preventDefault()}
        className="select-none object-cover"
        draggable={false}
      />
    </div>
  );
}

export function ProjectGrid({ projects }: { projects: Project[] }) {
  return (
    <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project, index) => (
        <Link key={project.id} href={`/projects/${project.id}`} className="group block">
          <ProjectCover project={project} priority={index === 0 || index === 1} />
          <h2 className="font-mono text-[11px] uppercase tracking-[0.12em] text-black group-hover:text-gray-500">
            {project.title}
          </h2>
          <p className="mt-1 max-w-[54ch] text-xs leading-relaxed text-gray-600">{project.description}</p>
        </Link>
      ))}
    </section>
  );
}
