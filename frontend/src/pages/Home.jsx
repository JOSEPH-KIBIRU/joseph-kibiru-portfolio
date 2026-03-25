import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import "./Home.css";

// Get API URL from environment variable
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const Home = () => {
  const [featuredProjects, setFeaturedProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedProjects();
  }, []);

  const fetchFeaturedProjects = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/projects/featured`);
      setFeaturedProjects(response.data);
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const skills = [
    { name: "React", level: 90 },
    { name: "Node.js", level: 85 },
    { name: "JavaScript", level: 95 },
    { name: "MongoDB", level: 80 },
    { name: "TypeScript", level: 75 },
    { name: "Next.js", level: 70 },
    { name: "PostgreSQL", level: 75 },
    { name: "AWS", level: 65 },
    { name: "Supabase", level: 90 },
  ];

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-content">
          <div className="hero-grid">
            <motion.div
              className="hero-text"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <span className="greeting">👋 Hello, I'm</span>
              <h1>
                <span className="highlight">Joseph Kibiru</span>
              </h1>
              <h2>Full Stack Developer</h2>
              <p>
                I craft elegant, scalable web applications with modern
                technologies. Specialized in React, Node.js, and cloud
                architecture.
              </p>

              <motion.div
                className="hero-stats"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                <div className="stat-item">
                  <span className="stat-number">2+</span>
                  <span className="stat-label">Years Experience</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">10+</span>
                  <span className="stat-label">Projects Completed</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">10+</span>
                  <span className="stat-label">Happy Clients</span>
                </div>
              </motion.div>

              <motion.div
                className="hero-buttons"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                <a href="/projects" className="btn primary">
                  <span>View My Work</span>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M5 12H19M19 12L12 5M19 12L12 19"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </a>
                <a href="/contact" className="btn secondary">
                  Let's Talk
                </a>
              </motion.div>
            </motion.div>

            <motion.div
              className="hero-image"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="image-wrapper">
                <div className="image-glow"></div>
                <img
                  src="/profile.jpeg"
                  alt="Joseph Kibiru"
                  className="profile-image"
                />
                <div className="image-border"></div>
                <div className="floating-shapes">
                  <div className="shape shape-1"></div>
                  <div className="shape shape-2"></div>
                  <div className="shape shape-3"></div>
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div
            className="hero-scroll"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <span>Scroll to explore</span>
            <div className="scroll-indicator"></div>
          </motion.div>
        </div>
      </section>

      <section className="skills">
        <div className="container">
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2>Technical Expertise</h2>
            <p>Technologies I work with</p>
          </motion.div>

          <div className="skills-grid">
            {skills.map((skill, index) => (
              <motion.div
                key={skill.name}
                className="skill-card"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="skill-info">
                  <span className="skill-name">{skill.name}</span>
                  <span className="skill-percentage">{skill.level}%</span>
                </div>
                <div className="skill-bar">
                  <motion.div
                    className="skill-progress"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${skill.level}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.2 + index * 0.1 }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="featured-projects">
        <div className="container">
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2>Featured Projects</h2>
            <p>Some of my best work</p>
          </motion.div>

          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
            </div>
          ) : (
            <div className="projects-grid">
              {featuredProjects.map((project, index) => (
                <motion.div
                  key={project._id}
                  className="project-card"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -10 }}
                >
                  <div className="project-image">
                    <img
                      src={project.imageUrl || "/placeholder.jpg"}
                      alt={project.title}
                    />
                    <div className="project-overlay">
                      {project.liveUrl && (
                        <a
                          href={project.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="project-link"
                        >
                          <span>Live Demo</span>
                        </a>
                      )}
                      {project.githubUrl && (
                        <a
                          href={project.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="project-link"
                        >
                          <span>GitHub</span>
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="project-info">
                    <h3>{project.title}</h3>
                    <p>{project.description}</p>
                    <div className="technologies">
                      {project.technologies?.map((tech) => (
                        <span key={tech} className="tech-tag">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {!loading && featuredProjects.length === 0 && (
            <p className="no-projects">
              No featured projects yet. Add some in the admin panel!
            </p>
          )}

          <motion.div
            className="view-all"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <a href="/projects" className="btn secondary">
              View All Projects
            </a>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;
