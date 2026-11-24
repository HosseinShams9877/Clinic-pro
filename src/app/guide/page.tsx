import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { getLocale } from "@/core/i18n/getLocale";
import { GuideDirectory } from "@/modules/publicSite/components/GuideDirectory";
import { guideUi } from "@/modules/publicSite/content/guideUi";
import { routeMetadata } from "@/modules/seo/lib/metadata";

export const metadata: Metadata = routeMetadata({
  title: "راهنمای قبل و بعد از عمل",
  description:
    "راهنمای قبل و بعد از عمل، آمادگی روز جراحی و مراقبت‌های پس از عمل؛ اطلاعات مدارک پذیرش و دریافت صورتحساب بیمه در مرکز جراحی دکتر خیرخواه کاشان.",
  path: "/guide",
});

export default async function GuidePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const locale = await getLocale();
  const query = await searchParams;
  const ui = guideUi[locale];

  return (
    <div className="page-doctors page-guide">
      <section className="phx gx">
        <div className="container">
          <div className="phx-in">
            <div className="phx-t">
              <nav className="crumbs" aria-label="breadcrumb">
                <Link href="/">{locale === "fa" ? "خانه" : locale === "en" ? "Home" : "الرئيسية"}</Link>
                <span>/</span>
                <b>{locale === "fa" ? "راهنمای بیماران" : locale === "en" ? "Patient Guide" : "دليل المرضى"}</b>
              </nav>
              <h1>{ui.lTitle}</h1>
              <p>{ui.lSub}</p>
              <ol className="gx-steps">
                <li>
                  <span>۱</span>
                  <b>{ui.j1}</b>
                </li>
                <li>
                  <span>۲</span>
                  <b>{ui.j2}</b>
                </li>
                <li>
                  <span>۳</span>
                  <b>{ui.j3}</b>
                </li>
              </ol>
            </div>
            <div className="phx-v gx-v" aria-hidden="true">
              <svg className="gx-path" viewBox="0 0 600 360" preserveAspectRatio="none">
                <path d="M70 250 C 170 90, 250 90, 300 170 S 450 270, 530 120" />
              </svg>
              <figure className="gx-t t1">
                <Image src="/img/guide/v-prep.jpg" alt="" width={300} height={360} sizes="15vw" />
                <figcaption>
                  <span>۱</span>
                  <b>{ui.j1}</b>
                </figcaption>
              </figure>
              <figure className="gx-t t2">
                <Image src="/img/guide/v-or.jpg" alt="" width={300} height={360} sizes="15vw" />
                <figcaption>
                  <span>۲</span>
                  <b>{ui.j2}</b>
                </figcaption>
              </figure>
              <figure className="gx-t t3">
                <Image src="/img/guide/v-doctor.jpg" alt="" width={300} height={360} sizes="15vw" />
                <figcaption>
                  <span>۳</span>
                  <b>{ui.j3}</b>
                </figcaption>
              </figure>
            </div>
          </div>
        </div>
      </section>

      <GuideDirectory locale={locale} initialQuery={query.q} />

      <section className="container guide-admission-refresh" aria-labelledby="guide-insurance-title" lang="fa" dir="rtl">
        <div className="guide-insurance-note">
          <h2 id="guide-insurance-title">صورتحساب و پیگیری بیمه پس از عمل</h2>
          <p>
            برخی سازمان‌ها و بیمه‌ها ممکن است بخشی از هزینه را پرداخت کنند. در صورت تمایل، ۱۴ روز پس از ترخیص، ساعت ۸ تا ۱۴، برای دریافت صورتحساب به واحد درآمد و ترخیص مراجعه کنید.
          </p>
          <Link className="operation-guide-link" href="/admission">
            مدارک و مراحل پذیرش را ببینید
          </Link>
        </div>
      </section>
    </div>
  );
}
