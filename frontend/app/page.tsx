import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  HeartHandshake,
  House,
  MessageCircleHeart,
  Sparkles,
  UsersRound,
} from "lucide-react";

const heroImage = "/images/demo/campus-group.jpg";
const faces = [
  { name: "Maya", image: "/images/demo/people/portrait-03.jpg" },
  { name: "Theo", image: "/images/demo/people/portrait-07.jpg" },
  { name: "Nia", image: "/images/demo/people/portrait-04.jpg" },
  { name: "Leo", image: "/images/demo/people/portrait-10.jpg" },
];

const features = [
  {
    icon: HeartHandshake,
    title: "Chemistry before square footage",
    body: "Find people who fit your routines, budget and idea of home—not just an empty room.",
    color: "bg-[#fff0f2] text-[#db4969]",
  },
  {
    icon: UsersRound,
    title: "Build your circle",
    body: "Meet one roommate or bring a few good matches together to form a group.",
    color: "bg-[#f1eaff] text-[#8952c5]",
  },
  {
    icon: MessageCircleHeart,
    title: "Talk the real stuff through",
    body: "Compare habits, align on expectations and get to know each other before you commit.",
    color: "bg-[#fff3df] text-[#ce8a31]",
  },
];

export default function Home() {
  return (
    <div className="overflow-hidden">
      <section className="mx-auto grid max-w-[1380px] items-center gap-10 px-4 pb-16 pt-10 sm:px-6 sm:pt-14 lg:grid-cols-[0.92fr_1.08fr] lg:gap-12 lg:pb-24 lg:pt-16">
        <div className="relative z-10 max-w-[610px]">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#f1e1dc] bg-white/80 px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#8a5c56] shadow-sm">
            <span className="instagram-gradient h-2 w-2 rounded-full" />
            Roommate matching, with more heart
          </div>
          <h1 className="text-[clamp(3.1rem,7vw,6.25rem)] font-black leading-[0.97] tracking-[-0.075em] text-[#282624]">
            Find your
            <br />
            people. Find
            <br />
            your <span className="text-gradient">place.</span>
          </h1>
          <p className="mt-7 max-w-[490px] text-base leading-7 text-[#77716f] sm:text-lg sm:leading-8">
            The best home starts with the right people. Meet students who share your rhythm, build a roommate group and make campus feel a little more like yours.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/profiles"
              className="instagram-gradient inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold text-white shadow-[0_12px_24px_rgba(226,67,105,0.22)] transition hover:-translate-y-0.5"
            >
              Meet your people <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login?mode=register"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[#e8e2de] bg-white px-6 py-3.5 text-sm font-bold text-[#383330] shadow-sm transition hover:border-[#ef9e9c] hover:bg-[#fffafa]"
            >
              <Sparkles className="h-4 w-4 text-[#e45a70]" />
              Create your profile
            </Link>
          </div>
          <div className="mt-9 flex items-center gap-4">
            <div className="flex -space-x-3">
              {faces.map((face, index) => (
                <div key={face.name} className="relative h-10 w-10 overflow-hidden rounded-full border-[3px] border-[#f7f6f4] shadow-sm" style={{ zIndex: faces.length - index }}>
                  <Image src={face.image} alt={face.name} fill sizes="40px" unoptimized className="object-cover" />
                </div>
              ))}
            </div>
            <div>
              <p className="text-sm font-bold text-[#383330]">Good people make a good home.</p>
              <p className="mt-0.5 text-xs text-[#918b87]">A more thoughtful way to find roommates.</p>
            </div>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[650px] lg:ml-auto">
          <div className="absolute -left-8 top-10 h-40 w-40 rounded-full bg-[#ffd6bf]/65 blur-3xl" />
          <div className="absolute -right-6 bottom-8 h-44 w-44 rounded-full bg-[#e4d3ff]/65 blur-3xl" />
          <div className="instagram-gradient relative rotate-[2deg] rounded-[34px] p-[3px] shadow-[0_32px_90px_rgba(130,63,87,0.2)] transition-transform duration-700 hover:rotate-0">
            <div className="relative h-[390px] overflow-hidden rounded-[31px] bg-[#eadbd1] sm:h-[510px]">
              <Image src={heroImage} alt="A group of friends enjoying time together" fill priority sizes="(max-width: 1024px) 90vw, 600px" unoptimized className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#261b1b]/80 via-transparent to-[#251a1a]/10" />
              <div className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full border border-white/30 bg-black/20 px-3 py-2 text-xs font-semibold text-white backdrop-blur-md sm:left-7 sm:top-7">
                <BadgeCheck className="h-4 w-4 text-[#93e0cf]" />
                Made for student life
              </div>
              <div className="absolute bottom-6 left-6 right-6 text-white sm:bottom-9 sm:left-9 sm:right-9">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/75">Your next chapter</p>
                <p className="mt-2 max-w-[380px] text-3xl font-extrabold leading-[1.05] tracking-[-0.05em] sm:text-5xl">Starts with a shared hello.</p>
                <div className="mt-5 flex items-center gap-2 text-sm font-medium text-white/85">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-white/20"><House className="h-3.5 w-3.5" /></span>
                  Find your people, then build a place.
                </div>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-5 left-0 z-10 flex items-center gap-3 rounded-2xl border border-white/80 bg-white/95 p-3.5 shadow-[0_16px_45px_rgba(40,31,27,0.12)] sm:-left-8 sm:bottom-10 sm:p-4">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#fff0f2] text-[#e34e70]"><HeartHandshake className="h-5 w-5" /></div>
            <div>
              <p className="text-sm font-bold text-[#342f2c]">Shared rhythms matter.</p>
              <p className="mt-0.5 text-xs text-[#8b8480]">Start with what makes a home feel right.</p>
            </div>
          </div>
          <div className="absolute -right-2 top-20 z-10 hidden rounded-2xl border border-white/80 bg-white/95 p-3.5 shadow-[0_16px_45px_rgba(40,31,27,0.12)] sm:block">
            <div className="flex items-center gap-2.5">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-[#f2eaff] text-[#8b55c8]"><Sparkles className="h-4 w-4" /></div>
              <div><p className="text-xs font-bold text-[#342f2c]">Your kind of people</p><p className="text-[10px] text-[#8b8480]">One good match at a time</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#eee9e5] bg-white/60 py-7">
        <div className="mx-auto grid max-w-[1200px] gap-4 px-4 sm:grid-cols-3 sm:px-6">
          {[
            { value: "01", title: "Show up as you are", note: "Create a profile that feels like you." },
            { value: "02", title: "Find your rhythm", note: "Meet people with compatible habits." },
            { value: "03", title: "Make it a group thing", note: "Start building your next home together." },
          ].map((step) => (
            <div key={step.value} className="flex items-start gap-3 rounded-2xl px-2 py-3 sm:px-4">
              <span className="text-xs font-extrabold tracking-[0.14em] text-[#df496c]">{step.value}</span>
              <div><p className="text-sm font-bold text-[#332f2c]">{step.title}</p><p className="mt-1 text-xs leading-5 text-[#89837f]">{step.note}</p></div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-[660px] text-center">
          <p className="eyebrow">A better way to roommate</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.06em] text-[#2b2826] sm:text-5xl">A home is more than a floor plan.</h2>
          <p className="mt-4 text-sm leading-6 text-[#7d7773] sm:text-base">Start with the little things that make living together feel easy.</p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article key={feature.title} className="surface-card p-6 transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(40,31,27,0.09)] sm:p-7">
                <div className={`grid h-12 w-12 place-items-center rounded-2xl ${feature.color}`}><Icon className="h-5 w-5" /></div>
                <h3 className="mt-5 text-lg font-bold tracking-[-0.03em] text-[#342f2c]">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#817b77]">{feature.body}</p>
              </article>
            );
          })}
        </div>
        <div className="mt-10 flex justify-center">
          <Link href="/profiles" className="group inline-flex items-center gap-2 text-sm font-bold text-[#d94368] hover:text-[#b42e50]">
            See who you could meet <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>
    </div>
  );
}
