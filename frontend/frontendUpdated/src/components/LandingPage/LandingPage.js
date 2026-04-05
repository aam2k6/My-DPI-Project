// import AOS from "aos";
// import "aos/dist/aos.css";
import React, { useState, useEffect, useCallback } from 'react';
import './LandingPage.css';
import IIITB from '../../assets/iiitb_image.png';
import WSL from '../../assets/WSL.jpg';
import FlowChart from '../../assets/flowchart.png';
import { frontend_host } from "../../config";
// import Publications from "../Publications/Publications";
import Publications from "../Publications/Publications";

const LandingPage = () => {

  const [hoveredCard, setHoveredCard] = useState(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const [activeSection, setActiveSection] = useState('main');

  useEffect(() => {
    document.body.classList.toggle("mobile-nav-active", isMobileOpen);
  }, [isMobileOpen]);

  const handleNavClick = (e, targetId) => {
    e.preventDefault();
    setIsMobileOpen(false);
    setActiveSection(targetId);
    document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
  };




  const services = [
    {
      id: 1,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#4F46E5">
          <path d="M10.802 17.77a.703.703 0 1 1-.002 1.406.703.703 0 0 1 .002-1.406m11.024-4.347a.703.703 0 1 1 .001-1.406.703.703 0 0 1-.001 1.406m0-2.876a2.176 2.176 0 0 0-2.174 2.174c0 .233.039.465.115.691l-7.181 3.823a2.165 2.165 0 0 0-1.784-.937c-.829 0-1.584.475-1.95 1.216l-6.451-3.402c-.682-.358-1.192-1.48-1.138-2.502.028-.533.212-.947.493-1.107.178-.1.392-.092.62.027l.042.023c1.71.9 7.304 3.847 7.54 3.956.363.169.565.237 1.185-.057l11.564-6.014c.17-.064.368-.227.368-.474 0-.342-.354-.477-.355-.477-.658-.315-1.669-.788-2.655-1.25-2.108-.987-4.497-2.105-5.546-2.655-.906-.474-1.635-.074-1.765.006l-.252.125C7.78 6.048 1.46 9.178 1.1 9.397.457 9.789.058 10.57.006 11.539c-.08 1.537.703 3.14 1.824 3.727l6.822 3.518a2.175 2.175 0 0 0 2.15 1.862 2.177 2.177 0 0 0 2.173-2.14l7.514-4.073c.38.298.853.461 1.337.461A2.176 2.176 0 0 0 24 12.72a2.176 2.176 0 0 0-2.174-2.174" />
        </svg>
      ),
      title: 'GitBook Documentation',
      link: "https://iiitb-ac.gitbook.io/anumati",
      description: 'The GitBook provides a comprehensive, user-friendly guide to Anumati’s concepts, workflows, and integration steps. It explains how consent-driven data flows work and how developers and organizations can adopt them within digital public infrastructure. '
    },
    {
      id: 2,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#4F46E5">
          <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
        </svg>
      ),
      title: 'GitHub',
      link: 'https://github.com/WSL-IIITB/DPI-Primitive',
      description: 'The GitHub repository contains the source code for Anumati, including the core services, APIs, and reference implementations. It enables developers to explore the architecture, contribute to the project, and deploy or extend the system in their own environments. .'
    },
    {
      id: 3,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5a2 2 0 0 0 2 2h1" />
          <path d="M16 21h1a2 2 0 0 0 2-2v-5a2 2 0 0 1 2-2 2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1" />
          <circle cx="9" cy="12" r="0.5" fill="#4F46E5" />
          <circle cx="12" cy="12" r="0.5" fill="#4F46E5" />
          <circle cx="15" cy="12" r="0.5" fill="#4F46E5" />
        </svg>
      ),
      title: 'Swagger',
      link: `${frontend_host}/api/swagger/`,
      description: 'The Swagger interface provides an interactive view of Anumati’s APIs, allowing developers to explore endpoints, understand request and response formats, and test integrations in real time. It serves as the primary reference for building applications that interact with the consent and data flow services. '
    }
  ];


  return (
    <>

      <header id="header" className="header d-flex align-items-center fixed-top">
        <div className="container-fluid container-xl position-relative d-flex align-items-center">

          <a href="/" className="logo d-flex align-items-center me-auto">

            <h1 className="sitename">Anumati</h1>
          </a>

          <nav id="navmenu" className={`navmenu ${isMobileOpen ? "active" : ""}`}>
            <ul>
              <li>
                <a href="#main"
                  onClick={(e) => handleNavClick(e, 'main')}
                  className={activeSection === 'main' ? 'active' : ''}>
                  Home
                </a>
              </li>
              <li>
                <a href="#usecases"
                  onClick={(e) => handleNavClick(e, 'usecases')}
                  className={activeSection === 'usecases' ? 'active' : ''}>
                  Use Cases
                </a>
              </li>
              <li>
                <a href="#documentation"
                  onClick={(e) => handleNavClick(e, 'documentation')}
                  className={activeSection === 'documentation' ? 'active' : ''}>
                  Documentation
                </a>
              </li>
              <li>
                <a href="#publications"
                  onClick={(e) => handleNavClick(e, 'publications')}
                  className={activeSection === 'publications' ? 'active' : ''}>
                  Publications
                </a>
              </li>
              <li>
                <a href="#about"
                  onClick={(e) => handleNavClick(e, 'about')}
                  className={activeSection === 'about' ? 'active' : ''}>
                  About Us
                </a>
              </li>
            </ul>

            {/* Mobile Toggle Button */}
            <i
              className={`mobile-nav-toggle d-xl-none bi ${isMobileOpen ? "bi-x" : "bi-list"
                }`}
              onClick={() => setIsMobileOpen(!isMobileOpen)}
            ></i>
          </nav>

          {/* <a className="btn-getstarted" href="index.html#about">Sign In/ Sign Up </a> */}
          <a className="btn-getstarted" href="login">
            Get Started
            <i className="bi bi-arrow-right arrow-icon"></i>
          </a>

        </div>
      </header>

      <section id="main" className="hero section">
        <div className="container">
          <div className="row gy-4">
            <div className="col-lg-6 order-2 order-lg-1 d-flex flex-column justify-content-center" data-aos="zoom-out">
              <h1>Consent Management System</h1>
              <p className="mt-3" style={{ fontSize: "18px" }}>Anumati is a consent management application that gives individuals and organizations continuous control over how their data flows between different services. It lets them grant, monitor, restrict, or withdraw consent based on purpose, time, and context, while also applying jurisdictional and institutional obligations so every data exchange stays compliant with regulations and the owner’s policies.</p>
              <p style={{ fontSize: "18px" }}>In simple terms, Anumati turns data sharing into a transparent, consent-driven and policy-compliant flow that always remains under the owner’s authority. </p>
              <div className="d-flex">
                <a href="login" className="btn-get-started">Get Started</a>
              </div>
              {/* <div className="row hero2">
                <div className="mt-5" data-aos="fade-up" data-aos-delay="100">
                  <p>
                    Imortance of Consent and flow control.
                  </p>
                  <ul>
                    <li><span><i className="bi bi-check2-circle"></i> Consent and flow control are the foundations of trusted data exchange in Digital Public Infrastructure (DPI), where data moves across many independent services, institutions, and jurisdictions. In such open, society-scale systems, simple one-time permission is not enough; people and organizations need ongoing control over how their data is used, shared, and governed.  </span></li>
                    <li className='mt-2'><span><i className="bi bi-check2-circle"></i> A consent-driven flow control model ensures that every data transaction follows the owner’s intent, complies with applicable regulations, and respects institutional policies. This makes data exchange in DPI transparent, accountable, and scalable, allowing services like education, healthcare, finance, and governance to operate on shared infrastructure without compromising user control or legal compliance. </span></li>
                  </ul>
                </div>
              </div> */}
            </div>
            <div className="col-lg-6 order-1 order-lg-2 hero-img" data-aos="zoom-out" data-aos-delay="200">
              <img src={FlowChart} className="img-fluid animated" alt="Flow Chart" style={{ borderRadius: "10px" }} />
            </div>
          </div>
          <div className="row hero2">
            <div className="mt-5" data-aos="fade-up" data-aos-delay="100">
              <p>
                Imortance of Consent and flow control.
              </p>
              <ul>
                <li><span><i className="bi bi-check2-circle"></i> Consent and flow control are the foundations of trusted data exchange in Digital Public Infrastructure (DPI), where data moves across many independent services, institutions, and jurisdictions. In such open, society-scale systems, simple one-time permission is not enough; people and organizations need ongoing control over how their data is used, shared, and governed.  </span></li>
                <li className='mt-2'><span><i className="bi bi-check2-circle"></i> A consent-driven flow control model ensures that every data transaction follows the owner’s intent, complies with applicable regulations, and respects institutional policies. This makes data exchange in DPI transparent, accountable, and scalable, allowing services like education, healthcare, finance, and governance to operate on shared infrastructure without compromising user control or legal compliance. </span></li>
                {/* <li><i className="bi bi-check2-circle"></i> <span>Ullamco laboris nisi ut aliquip ex ea commodo</span></li>
                    <li><i className="bi bi-check2-circle"></i> <span>Duis aute irure dolor in reprehenderit in voluptate velit.</span></li> */}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="usecases" className="certifications section">
        <div className="container section-title">
          <h2>Use Cases</h2>
          {/* <p>Necessitatibus eius consequatur ex aliquid fuga eum quidem sint consectetur velit</p> */}
        </div>

        <div className="container" data-aos="fade-up" data-aos-delay="100">

          <div className="certification-grid" data-aos="fade-up" data-aos-delay="400">

            <div className="cert-card" data-aos="flip-left" data-aos-delay="100">
              {/* <div className="cert-icon">
                <img src="assets/img/construction/badge-1.webp" alt="Banking & Financial Data" className="img-fluid" />
              </div> */}
              <div className="cert-details hero2">
                <h5>Job applications and credential sharing </h5>
                {/* <span className="cert-category">Quality Management</span> */}
                <p>A student applying for jobs can share academic records with multiple companies while:</p>
                <ul>
                  <li><span><i className="bi bi-caret-right-fill"></i> Granting access only for hiring purposes </span></li>
                  <li><span><i className="bi bi-caret-right-fill"></i> Limiting how long the company can view the documents </span></li>
                  <li><span><i className="bi bi-caret-right-fill"></i> Preventing reuse of the data for unrelated purposes </span></li>
                  <li><span><i className="bi bi-caret-right-fill"></i> If the hiring process ends, access can be withdrawn automatically.</span></li>
                </ul>
                {/* <p>If the hiring process ends, access can be withdrawn automatically.</p> */}
              </div>
            </div>

            <div className="cert-card" data-aos="flip-left" data-aos-delay="200">
              {/* <div className="cert-icon">
                <img src="assets/img/construction/badge-2.webp" alt="Healthcare Records" className="img-fluid" />
              </div> */}
              <div className="cert-details hero2">
                <h5>Healthcare data exchange</h5>
                {/* <span className="cert-category">Safety Standards</span> */}
                <p>A patient visiting different hospitals or specialists can: </p>
                <ul>
                  <li><span><i className="bi bi-caret-right-fill"></i> Allow doctors to access only relevant medical records </span></li>
                  <li><span><i className="bi bi-caret-right-fill"></i> Restrict use to treatment purposes </span></li>
                  <li><span><i className="bi bi-caret-right-fill"></i> Ensure data is handled according to health regulations </span></li>
                  <li><span><i className="bi bi-caret-right-fill"></i> The patient remains in control even after the data is shared. </span></li>
                </ul>
                {/* <p>The patient remains in control even after the data is shared. </p> */}
              </div>
            </div>

            <div className="cert-card" data-aos="flip-left" data-aos-delay="300">
              {/* <div className="cert-icon">
                <img src="assets/img/construction/badge-3.webp" alt="Education & Credentials" className="img-fluid" />
              </div> */}
              <div className="cert-details hero2">
                <h5> Loan and financial services </h5>
                {/* <span className="cert-category">Legal Compliance</span> */}
                <p>When applying for a loan, a user may need to share income proofs, tax records, or account statements. </p>
                <ul>
                  <li><span><i className="bi bi-caret-right-fill"></i> Data is shared only with the lending institution </span></li>
                  <li><span><i className="bi bi-caret-right-fill"></i> Access expires after the loan decision </span></li>
                  <li><span><i className="bi bi-caret-right-fill"></i> Financial regulations and institutional policies are automatically enforced </span></li>
                </ul>
              </div>
            </div>

            <div className="cert-card" data-aos="flip-left" data-aos-delay="400">
              {/* <div className="cert-icon">
                <img src="assets/img/construction/badge-4.webp" alt="Smart Cities & IoT" className="img-fluid" />
              </div> */}
              <div className="cert-details hero2">
                <h5>Government service delivery </h5>
                {/* <span className="cert-category">Sustainable Building</span> */}
                <p>Citizens applying for benefits, permits, or licenses can:</p>
                <ul>
                  <li><span><i className="bi bi-caret-right-fill"></i> Share only the required documents </span></li>
                  <li><span><i className="bi bi-caret-right-fill"></i> Ensure agencies use the data only for the specific service </span></li>
                  <li><span><i className="bi bi-caret-right-fill"></i> Maintain visibility into how their data moves across departments </span></li>
                </ul>
              </div>
            </div>

            {/* <div className="cert-card" data-aos="flip-left" data-aos-delay="500">
              <div className="cert-icon">
                <img src="assets/img/construction/badge-6.webp" alt="Research & Academia" className="img-fluid" />
              </div>
              <div className="cert-details">
                <h5>Research & Academia</h5>
                <p>Ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
              </div>
            </div>

            <div className="cert-card" data-aos="flip-left" data-aos-delay="600">
              <div className="cert-icon">
                <img src="assets/img/construction/badge-7.webp" alt="Government Data Exchange" className="img-fluid" />
              </div>
              <div className="cert-details">
                <h5>Government Data Exchange</h5>
                <p>Ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
              </div>
            </div> */}

          </div>


        </div>

      </section>

      <section id="documentation" className="documentation section">
        <div className="container section-title" style={{ paddingBottom: "40px" }}>
          <h2>Documentation</h2>
          {/* <p>Necessitatibus eius consequatur ex aliquid fuga eum quidem sint consectetur velit</p> */}
        </div>

        <div className="container pb-5">
          <div className="row g-5">
            {services.map((service) => (
              <div key={service.id} className="col-12 col-md-6 col-lg-4">
                <div
                  className="card service-card h-100 border-2 shadow-md"
                  // style={{ backgroundColor: '#030304' }}
                  onMouseEnter={() => setHoveredCard(service.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <div className="card-body text-center p-2 card-content">
                    <div
                      className="icon-wrapper d-inline-flex align-items-center justify-content-center rounded-3 mb-4"
                      style={{
                        width: '72px',
                        height: '72px',
                        backgroundColor: '#e3f0ff'
                      }}
                    >
                      {service.icon}
                    </div>

                    <h5 className="card-title fw-semibold mb-3" style={{ color: '#1F2937' }}>
                      {service.title}
                    </h5>

                    <p className="card-text mb-4" style={{ color: '#6B7280', fontSize: '0.95rem' }}>
                      {service.description}
                    </p>

                    <button
                      className="btn btn-outline-primary view-details-btn px-4 py-2 mb-2"
                      onClick={() => window.open(service.link, '_blank')}
                      style={{
                        borderColor: '#14529D',
                        color: '#14529D',
                        fontWeight: '500',
                        borderRadius: '8px'
                      }}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section  id="publications" className="publications section">
        <div className="container section-title" style={{ paddingBottom: "40px" }}>
          <h2>Publications</h2>
        </div>
        <Publications />
      </section>

      <section id="about" className="team section" style={{ marginBottom: "8%", marginTop: "3%" }}>
        <div className="container section-title" style={{ paddingBottom: "50px" }}>
          <h2>About Us</h2>
          {/* <p>Necessitatibus eius consequatur ex aliquid fuga eum quidem sint consectetur velit</p> */}
        </div>

        <div className="container" data-aos="fade-up" data-aos-delay="100">

          <div className="row gy-4">

            <div className="col-lg-6" data-aos="fade-up" data-aos-delay="100">
              <div className="team-card featured">
                <div className="team-header">
                  <div className="team-image">
                    <img src={IIITB} className="img-fluid" alt="IIITB Logo" />
                  </div>

                  <div className="team-info">
                    <h4>International Institute of Information Technology Bangalore</h4>
                  </div>
                </div>
                <div className="team-details">
                  <p>Broad academic philosophy, practice-oriented learning, emphasis on research, entrepreneurial support, excellent peer group, global exchange opportunity.</p>
                  <div className="social-links">
                    <a href="https://www.iiitb.ac.in/" target="_blank" rel="noopener noreferrer"><i className="bi bi-globe2"></i></a>
                    <a href="https://www.linkedin.com/school/iiitbofficial/" target="_blank" rel="noopener noreferrer"><i className="bi bi-linkedin"></i></a>
                    <a href="https://x.com/IIITB_official" target="_blank" rel="noopener noreferrer"><i className="bi bi-twitter-x"></i></a>
                    <a href="https://www.facebook.com/IIITBofficial" target="_blank" rel="noopener noreferrer"><i className="bi bi-facebook"></i></a>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-6" data-aos="fade-up" data-aos-delay="200">
              <div className="team-card featured">
                <div className="team-header">
                  <div className="team-image">
                    <img src={WSL} className="img-fluid" alt="" />
                  </div>
                  <div className="team-info">
                    <h4>Web Science Lab</h4>
                  </div>
                </div>
                <div className="team-details">
                  <p>The Web Science Lab (WSL) at IIIT Bangalore is interested in understanding how the Internet, WWW and AI affects different facets of human life.</p>
                  {/* <div className="credentials">
                  <div className="cred-item">
                    <i className="bi bi-person-badge"></i>
                    <span>Licensed Contractor</span>
                  </div>
                  <div className="cred-item">
                    <i className="bi bi-tools"></i>
                    <span>Site Management</span>
                  </div>
                </div> */}
                  <div className="social-links">
                    <a href="https://wsl.iiitb.ac.in" target="_blank" rel="noopener noreferrer"><i className="bi bi-globe2"></i></a>
                    <a href="https://youtube.com/@wsllab9304?si=rkqfRhC9PHhIziFm" target="_blank" rel="noopener noreferrer"><i className="bi bi-youtube"></i></a>
                    <a href="#"><i className="bi bi-twitter-x"></i></a>
                    <a href="#"><i className="bi bi-instagram"></i></a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </>
  )
};

export default LandingPage;