import { useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQuoteLeft, faQuoteRight } from '@fortawesome/free-solid-svg-icons';
import "./Publications.css";

const publications = [
  {
    id: 1,
    type: "Preprint",
    year: "2023",
    title: "Extensible Consent Management Architectures for Data Trusts",
    authors: ["Balambiga Ayappane", "Rohith Vaidyanathan", "Srinath Srinivasa", "Jayati Deshmukh"],
    venue: "arXiv preprint",
    identifier: "arXiv:2309.16789",
    doi: "https://arxiv.org/abs/2309.16789",
    tags: ["Consent Management", "Data Trusts", "Architecture"],
  },
  {
    id: 2,
    type: "Conference",
    year: "2024",
    title: "Consent Service Architecture for Policy-Based Consent Management in Data Trusts",
    authors: [
      "Balambiga Ayappane",
      "Rohith Vaidyanathan",
      "Srinath Srinivasa",
      "Santosh K. Upadhyaya",
      "Srinivas Vivek",
    ],
    venue: "CODS-COMAD 2024",
    identifier: "ACM · Jan 04–07, 2024 · Bangalore",
    doi: "http://dl.acm.org/doi/10.1145/3632410.3632415",
    tags: ["Policy-Based", "Consent Service", "Data Trusts"],
  },
  {
    id: 3,
    type: "Workshop",
    year: "2024",
    title: "What Makes Consent Meaningful?",
    authors: ["Asilata Karandikar"],
    venue: "WebSci Companion '24",
    identifier: "16th ACM Web Science Conference",
    doi: "https://doi.org/10.1145/3630744.3658616",
    tags: ["Meaningful Consent", "Web Science", "Ethics"],
  },
];

// const typeStyles = {
//   Preprint:   { label: "Preprint", color: "#3B82F6" },
//   Conference: { label: "Conference", color: "#059669" },
//   Workshop:   { label: "Workshop", color: "#8B5CF6" },
// };

// const accentGradients = {
//   Preprint:   "linear-gradient(90deg, #3B82F6, #60A5FA)",
//   Conference: "linear-gradient(90deg, #059669, #34D399)",
//   Workshop:   "linear-gradient(90deg, #8B5CF6, #C084FC)",
// };

// const chipStyles = {
//   Preprint:   { color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE" },
//   Conference: { color: "#047857", bg: "#ECFDF5", border: "#A7F3D0" },
//   Workshop:   { color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE" },
// };

// const venueBg = {
//   Preprint:   "#3B82F6",
//   Conference: "#059669",
//   Workshop:   "#8B5CF6",
// };

const LinkIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
    <polyline points="15 3 21 3 21 9"/>
    <line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
);

export default function Publications() {
  return (
    <div className="container">

        <div className="pp-cards" style={{padding:"20px"}}>
          {publications.map((pub) => {
            // const ts = typeStyles[pub.type];
            // const cs = chipStyles[pub.type];
            return (
              <div className="pp-card" key={pub.id}>
                {/* Top color bar */}
                <div
                  className="pp-card-accent"
                //   style={{ background: accentGradients[pub.type] }}
                />
<div className="index-box">
                <div className="pub-index">{pub.id}</div>
                </div>

                <div className="pp-card-body">
                  {/* Type chip + year */}
                  <div className="pp-card-top">
                    {/* <span
                      className="pp-type-chip"
                      style={{ color: cs.color, background: cs.bg, borderColor: cs.border }}
                    >
                      {ts.label}
                    </span> */}
                    
                    <h3 className="pp-title">{pub.title}</h3>
                    <span className="pp-year">{pub.year}</span>
                  </div>


                  {/* Authors */}
                  <p className="pp-authors">
                    {pub.authors.map((a, i) => (
                      <span key={i}>
                        <strong>{a}</strong>
                        {i < pub.authors.length - 1 ? ", " : ""}
                      </span>
                    ))}
                  </p>

                  {/* Venue */}
                  

                  {/* Footer */}
                  <div className="pp-card-footer">
                    <div className="pp-venue-row">
                    <span
                      className="pp-venue-name"
                      style={{ background: "#F0F4FD", color: "#6B7A99" }}
                    >
                      {pub.venue}
                    </span>
                    <span className="pp-venue-id">{pub.identifier}</span>
                  </div>
                    <a
                      href={pub.doi}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="pp-link"
                    //   style={{ background: accentGradients[pub.type] }}
                    >
                      View Paper <LinkIcon />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
  );
}