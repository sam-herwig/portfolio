export default {
  name: "expandableGallery",
  title: "Expandable Gallery",
  type: "object",
  fields: [
    {
      name: "title",
      title: "Section Title",
      type: "string",
      initialValue: "FEATURED WORK",
      description: "Title displayed above the gallery"
    },
    {
      name: "projects",
      title: "Projects",
      type: "array",
      of: [
        {
          type: "reference",
          to: [{ type: "project" }]
        }
      ],
      validation: Rule => Rule.required().min(2).max(6),
      description: "Select 2-6 projects to display in the expandable gallery"
    }
  ],
  preview: {
    select: {
      projects: "projects"
    },
    prepare({ projects }) {
      const count = projects ? projects.length : 0;
      return {
        title: "Expandable Gallery",
        subtitle: `${count} project${count !== 1 ? 's' : ''} selected`
      };
    }
  }
};