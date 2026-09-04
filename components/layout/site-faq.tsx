'use client';

import { useState } from 'react';

const faqItems = [
  {
    question: 'What is SpookyCoins?',
    answer:
      'SpookyCoins is built for people who like finding crypto projects early. We bring new launches, presales, and active community picks into one place that is easier to scan.',
  },
  {
    question: 'How are rankings calculated?',
    answer:
      'Rankings follow the votes hunters give each project. Active boosts add temporary vote power, so boosted projects get more visibility while still competing with the rest of the market.',
  },
  {
    question: 'How is trending determined?',
    answer:
      'A coin can trend when hunters start paying attention to it quickly. Recent votes and watchlist activity help us spot projects that are heating up.',
  },
  {
    question: 'What are boosted coins?',
    answer:
      'Boosts are paid visibility upgrades for listed projects. They can help a coin compete harder in rankings, but they do not lock in a guaranteed spot.',
  },
  {
    question: 'How do I submit a coin?',
    answer:
      'Submit your project with the required details, links, logo, and market information. We review it first so the listings stay clean for everyone.',
  },
  {
    question: 'Why is market or chart data missing?',
    answer:
      'Some tokens are too new or not supported by every data source yet. If we cannot verify a chart, DEX, or market feed, we would rather leave it blank than show something broken.',
  },
  {
    question: 'Do I need an account to vote or watch coins?',
    answer:
      'Yes. Accounts help keep voting fair and let you build a watchlist you can come back to or share with other hunters.',
  },
];

export function SiteFaq() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  return (
    <section className="container home-faq" aria-labelledby="site-faq-title">
      <div className="home-faq-head">
        <small>FAQ</small>
        <h2 id="site-faq-title">Frequently Asked Questions</h2>
        <p>
          Quick answers about rankings, boosts, submissions, and the data shown around SpookyCoins.
        </p>
      </div>
      <div className="home-faq-list">
        {faqItems.map((item, index) => (
          <details key={item.question} open={openFaqIndex === index}>
            <summary
              onClick={(event) => {
                event.preventDefault();
                setOpenFaqIndex((current) => (current === index ? null : index));
              }}
            >
              {item.question}
            </summary>
            <div className="home-faq-answer">
              <p>{item.answer}</p>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
