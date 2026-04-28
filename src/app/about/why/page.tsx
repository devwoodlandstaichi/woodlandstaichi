import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageHeader } from "@/components/page-header";
import { ContactSection } from "@/components/contact-section";

export const metadata: Metadata = {
  title: "Why Tai Chi — what the form does",
  description:
    "Each movement of the Yang form has internal applications that affect the energy flow of the body. The benefits, movement by movement.",
};

// Movement-by-movement benefits, transcribed verbatim from the
// founder's writing. Apostrophes, em-dashes, capitalisation, and a
// handful of typos ('if'/'of', 'spin'/'spine', 'felling'/'feeling')
// are preserved deliberately — the language is the founder's.
//
// The first item is the OPENING, the last is the CLOSING. The 20
// in between are the body of the form, in performance order.

type Movement = { name: string; body: string };

const OPENING: Movement = {
  name: "Opening",
  body: "This movement focuses the mind, causes relaxation, restores the internal systems and external muscles to their proper alignment, which in turn results in comfort. The chi breathing is harmonious, invigorating to the spirit, and tones the nervous system.",
};

const FORM: Movement[] = [
  {
    name: "Parting the Wild Horse's Mane",
    body: "This invigorates the nervous system. It also strengthens the muscles of the face and neck and improves circulation and complexion of the skin.",
  },
  {
    name: "White Crane Spreads Its Wings",
    body: "This diagonal upright opening of the human figure extends and contracts the chest and back, toning the spinal nerves, up righting the coccyx and strengthening the alertness if the cerebrum.",
  },
  {
    name: "Brush Knee Twist Step",
    body: "This exercise contracts and strengthens the posterior muscles of the body. It also increases strength in the legs.",
  },
  {
    name: "Play the Lute",
    body: "The emphasis here is on the training of the abdominal, waist, shoulder, and posterior muscles. It tremendously increases the extending and contracting strength of the two arms.",
  },
  {
    name: "Repulse the Monkey",
    body: "The entire nervous system is benefited by this form. It also centers the spinal cord.",
  },
  {
    name: "Grasp the Sparrow's Tail",
    body: "This form emphasizes the splitting and enclosing of the limbs and the contracting and expanding of muscles. They strengthen the muscles of the back and abdomen and help relieve constipation. The lungs are expanded and become strong, thereby helping to strengthen the heart. The legs and thighs are strengthened, and circulation is improved.",
  },
  {
    name: "Single Whip",
    body: "This movement expands and contracts the joints, bones, and muscles of the hips and legs. It emphasizes split energy, and thus increases the flow of blood to the abdomen, improving digestion. The liver is invigorated, lungs expanded, and the knee and hip joints are made flexible.",
  },
  {
    name: "Wave Hands Like the Clouds",
    body: "The individual gains tranquility and calmness by the direct flow of energy from the tan tien (psychic center) to the whole body. Nerves are calmed, and the mind becomes peaceful and concentrated. Besides the reduction of excess weight in the waist line, it gives a general felling if joyfulness and well-being.",
  },
  {
    name: "Pat the High Horse",
    body: "This movement stimulates the chi (energy) of both arms, develops the chest, and improves posture.",
  },
  {
    name: "Kick Right Foot, Kick Left Foot",
    body: "These forms increase the energy in the legs.",
  },
  {
    name: "Strike Both Ears",
    body: "This makes the spin supple and elastic. It also strengthens the muscles of the arms.",
  },
  {
    name: "Snake Creeps Down",
    body: "These increase the elasticity of the thighs, and buttocks, and benefits the neck, shoulders, arms, thighs, calves, ankles, back, and abdomen. They invigorate the whole system.",
  },
  {
    name: "Golden Pheasant Stands on One Leg",
    body: "These forms vigorously contract and strengthen the abdominal muscles, tone the spinal nerves, and abdominal organs as a result of concentrating the center of gravity on one leg without wavering.",
  },
  {
    name: "Fair Maiden Works the Shuttles",
    body: "This form relieves cramps and stiffness of the neck. It strengthens the entire chest and spinal area. The expansion of the legs and hands benefits those areas.",
  },
  {
    name: "Needle at the Bottom of the Sea",
    body: "The knees and the life force of the spinal cord are particularly benefited by this form.",
  },
  {
    name: "Fan Through the Back",
    body: "This form harmonizes the outer form of the body and stimulates the internal glands and organs. It trains the strength of the shoulders, back, and legs. It also develops the lungs, neck, arms, wrists, knees, calves and ankles.",
  },
  {
    name: "Turn and Chop with Fist",
    body: "This form reduces excess fat around the waist. It strengthens the waist as well as the thighs.",
  },
  {
    name: "Step, Parry, and Punch",
    body: "The glandular functions are balanced. This form also strengthens the spinal column and knee joints and promotes flexibility in the hips.",
  },
  {
    name: "Apparent Close-up (Two Hand Push)",
    body: "This form increases the peristalsis of the bowels, invigorates the appetite, harmonizes gastric excretions. It also tones the spinal nerves and abdominal organs.",
  },
  {
    name: "Cross Hands (Two Hand Breathing)",
    body: "By vigorously stretching the arms, inhalation and exhalation are emphasized. The movements also tone the sympathetic nerves.",
  },
];

const CLOSING: Movement = {
  name: "Closing",
  body: "This form promotes the healthy flow of chi and concentrates the mind.",
};

export default function WhyTaiChiPage() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <PageHeader
          eyebrow="Why Tai Chi"
          title="What the form"
          italic="does."
          intro="In addition to the general health benefits of taijiquan, each movement of the form has internal applications that affect the energy flow of the body."
          glyph="益"
        />

        <section className="mx-auto max-w-5xl px-6 py-3 md:py-5">
          {/* Opening — bookend treatment */}
          <Bookend label="Opening" movement={OPENING} index={1} />

          {/* The form proper, numbered 02–21 */}
          <div className="mt-3">
            <p className="text-xs uppercase tracking-[0.45em] text-foreground/55 mb-6">
              <span className="inline-block h-px w-8 align-middle bg-vermillion mr-3" />
              The form
            </p>
            <ol className="grid gap-x-8 gap-y-10 md:grid-cols-2">
              {FORM.map((m, i) => (
                <li key={m.name}>
                  <MovementCard movement={m} index={i + 2} />
                </li>
              ))}
            </ol>
          </div>

          {/* Closing — bookend treatment */}
          <div className="mt-4">
            <Bookend label="Closing" movement={CLOSING} index={22} />
          </div>

          <p className="mt-4 text-sm text-foreground/55 italic max-w-prose">
            — Based on the teaching and writings of Master George Ling Hu.
          </p>

        </section>

        <ContactSection />
      </main>
      <SiteFooter />
    </>
  );
}

function MovementCard({
  movement,
  index,
}: {
  movement: Movement;
  index: number;
}) {
  return (
    <article>
      <p className="font-mono text-xs tabular-nums text-vermillion mb-1">
        {String(index).padStart(2, "0")}
      </p>
      <h3 className="font-display text-2xl md:text-[1.7rem] leading-[1.15] tracking-tight">
        {movement.name}
      </h3>
      <p className="mt-3 text-base text-foreground/80 leading-relaxed">
        {movement.body}
      </p>
    </article>
  );
}

function Bookend({
  label,
  movement,
  index,
}: {
  label: string;
  movement: Movement;
  index: number;
}) {
  // Ceremonial centred treatment — like a chapter divider in a
  // printed book. Replaces the previous card-with-eyebrow style
  // which made OPENING / CLOSING feel like the same shape as a
  // regular form-movement card.
  return (
    <article className="relative mx-auto max-w-2xl text-center py-3 md:py-5">
      <DecorativeRule />
      <p className="mt-7 text-[10px] uppercase tracking-[0.5em] text-foreground/50">
        <span className="font-mono text-vermillion mr-2 tabular-nums">
          {String(index).padStart(2, "0")}
        </span>
        {label}
      </p>
      <h2 className="mt-5 font-display text-5xl md:text-6xl italic leading-[1] tracking-tight">
        {movement.name}
      </h2>
      <p className="mt-6 text-lg text-foreground/75 leading-relaxed font-display italic">
        {movement.body}
      </p>
      <div className="mt-9">
        <DecorativeRule />
      </div>
    </article>
  );
}

/** A short centred horizontal rule with a small vermillion diamond in
 * the middle — classical book-divider treatment. */
function DecorativeRule() {
  return (
    <div
      aria-hidden
      className="mx-auto flex w-32 items-center gap-3 text-vermillion/70"
    >
      <span className="h-px flex-1 bg-foreground/20" />
      <span className="text-[10px] tracking-tighter">◆</span>
      <span className="h-px flex-1 bg-foreground/20" />
    </div>
  );
}
