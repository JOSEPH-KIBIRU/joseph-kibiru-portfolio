import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import ProjectForm from './ProjectForm';
import './ProjectManager.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const ProjectManager = ({ onLogout }) => {
  const [projects, setProjects] = useState([]);
  const [editingProject, setEditingProject] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/projects`);
      setProjects(response.data);
      setError('');
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError('Failed to load projects. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const items = Array.from(projects);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setProjects(items);

    // Update order in backend
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
      await axios.post(
        `${API_URL}/api/admin/projects/reorder`,
        { projects: items },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error('Error reordering projects:', error);
      // Revert on error
      fetchProjects();
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
        await axios.delete(`${API_URL}/api/admin/projects/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchProjects();
      } catch (error) {
        console.error('Error deleting project:', error);
        alert('Failed to delete project. Please try again.');
      }
    }
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setShowForm(true);
  };

  const handleAddNew = () => {
    setEditingProject(null);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingProject(null);
    fetchProjects();
  };

  if (loading) {
    return <div className="loading">Loading projects...</div>;
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>Project Manager</h1>
        <div className="admin-actions">
          <button onClick={handleAddNew} className="btn-add">
            + Add New Project
          </button>
          <button onClick={onLogout} className="btn-logout">
            Logout
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="projects">
          {(provided) => (
            <div
              className="projects-list"
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {projects.length === 0 ? (
                <div className="no-projects">
                  <p>No projects yet. Click "Add New Project" to create your first project!</p>
                </div>
              ) : (
                projects.map((project, index) => (
                  <Draggable
                    key={project._id}
                    draggableId={project._id}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <div
                        className={`project-item ${snapshot.isDragging ? 'dragging' : ''}`}
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                      >
                        <div className="drag-handle" {...provided.dragHandleProps}>
                          ⋮⋮
                        </div>
                        
                        <div className="project-preview">
                          {project.imageUrl && (
                            <img 
                              src={`${API_URL}${project.imageUrl}`} 
                              alt={project.title}
                              className="project-thumbnail"
                            />
                          )}
                        </div>

                        <div className="project-info">
                          <div className="project-header">
                            <h3>{project.title}</h3>
                            {project.featured && (
                              <span className="featured-badge">Featured</span>
                            )}
                          </div>
                          <p className="project-description">{project.description}</p>
                          <div className="project-tags">
                            {project.technologies?.map(tech => (
                              <span key={tech} className="tech-tag">{tech}</span>
                            ))}
                          </div>
                          <div className="project-links">
                            {project.liveUrl && (
                              <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">Live Demo</a>
                            )}
                            {project.githubUrl && (
                              <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">GitHub</a>
                            )}
                          </div>
                        </div>

                        <div className="project-actions">
                          <button 
                            onClick={() => handleEdit(project)}
                            className="btn-edit"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(project._id)}
                            className="btn-delete"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {showForm && (
        <ProjectForm
          project={editingProject}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
};

export default ProjectManager;