import Image from "next/image";

export default function PricingModels({
  models,
}: {
  models: readonly { name: string; logo: string }[];
}) {
  if (!models.length) return null;

  return (
    <section
      className="mt-8 border-t border-dashed border-neutral-200 pt-6"
      aria-label="Included image models"
    >
      <div className="flex flex-wrap items-center gap-2.5">

        <span className="text-xs text-[#737373]">Access to all {models.length} models</span>
      </div>
      <ul className="m-0 mt-4 flex list-none flex-wrap gap-2 p-0">
        {models.map((model) => (
          <li
            key={model.name}
            className="inline-flex max-w-full items-center gap-2 px-2 py-1.5 text-[13px] font-medium leading-normal text-[#262626]"
          >
            <Image
              src={model.logo}
              alt=""
              width={20}
              height={20}
              className="size-5 shrink-0 object-contain"
            />
            <span>{model.name}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
