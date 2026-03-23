import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import ProjectForm from './ProjectForm';
import './ProjectManager.css'
const ProjectManager = ({ onLogout }) => {
  const [projects, setProjects] = useState([]);
  const [editingProject, setEditingProject] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/projects');
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const items = Array.from(projects);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setProjects(items);

    // Update order in backend
    const token = localStorage.getItem('token');
    await axios.post('http://localhost:5000/api/admin/projects/reorder', 
      { projects: items },
      { headers: { Authorization: `Bearer ${token}` } }
    );
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/admin/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchProjects();
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>Project Manager</h1>
        <div className="admin-actions">
          <button onClick={() => setShowForm(true)} className="btn-add">
            Add Project
          </button>
          <button onClick={onLogout} className="btn-logout">
            Logout
          </button>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="projects">
          {(provided) => (
            <div
              className="projects-list"
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {projects.map((project, index) => (
                <Draggable
                  key={project._id}
                  draggableId={project._id}
                  index={index}
                >
                  {(provided) => (
                    <div
                      className="project-item"
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                    >
                      <div className="drag-handle" {...provided.dragHandleProps}>
                        ⋮⋮
                      </div>
                      <div className="project-info">
                        <h3>{project.title}</h3>
                        <p>{project.description}</p>
                        <div className="project-tags">
                          {project.technologies.map(tech => (
                            <span key={tech}>{tech}</span>
                          ))}
                        </div>
                      </div>
                      <div className="project-actions">
                        <button onClick={() => {
                          setEditingProject(project);
                          setShowForm(true);
                        }}>Edit</button>
                        <button onClick={() => handleDelete(project._id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {showForm && (
        <ProjectForm
          project={editingProject}
          onClose={() => {
            setShowForm(false);
            setEditingProject(null);
            fetchProjects();
          }}
        />
      )}
    </div>
  );
};

export default ProjectManager;