// Local mock implementation for standalone development
// Replaces the Base44 SDK client

const mockRoutes = [
  {
    id: '1',
    name: 'Sample Route',
    grade: 'V3',
    style: 'boulder',
    description: 'A nice warm-up route',
    setter_name: 'Local Setter',
    wall_image_url: 'https://via.placeholder.com/500x600',
    holds: [
      { x: 50, y: 50, type: 'start' },
      { x: 150, y: 100, type: 'middle' },
      { x: 250, y: 50, type: 'end' },
    ],
    published: true,
    created_by: 'user@example.com',
    created_date: new Date().toISOString(),
  }
];

export const base44 = {
  auth: {
    me: async () => {
      const stored = localStorage.getItem('current_user');
      if (stored) {
        return JSON.parse(stored);
      }
      // Return a mock user if logged in
      const mockUser = {
        id: 'local-user-1',
        email: 'user@localhost.local',
        name: 'Local User',
      };
      localStorage.setItem('current_user', JSON.stringify(mockUser));
      return mockUser;
    },
    logout: async () => {
      localStorage.removeItem('current_user');
    },
    redirectToLogin: () => {
      // No-op for local dev
      console.log('Redirect to login (no-op in local dev)');
    },
  },
  entities: {
    Route: {
      filter: async (query, sortBy, limit) => {
        // Return mock routes or filtered from localStorage
        let routes = JSON.parse(localStorage.getItem('routes') || JSON.stringify(mockRoutes));
        
        if (query.id) {
          return routes.filter(r => r.id === query.id);
        }
        if (query.created_by) {
          return routes.filter(r => r.created_by === query.created_by);
        }
        if (query.published !== undefined) {
          return routes.filter(r => r.published === query.published);
        }
        
        return routes;
      },
      create: async (routeData) => {
        const routes = JSON.parse(localStorage.getItem('routes') || JSON.stringify(mockRoutes));
        const newRoute = {
          id: Date.now().toString(),
          ...routeData,
          created_date: new Date().toISOString(),
          created_by: localStorage.getItem('current_user') ? JSON.parse(localStorage.getItem('current_user')).email : 'user@localhost.local',
        };
        routes.push(newRoute);
        localStorage.setItem('routes', JSON.stringify(routes));
        return newRoute;
      },
      update: async (id, routeData) => {
        const routes = JSON.parse(localStorage.getItem('routes') || JSON.stringify(mockRoutes));
        const index = routes.findIndex(r => r.id === id);
        if (index !== -1) {
          routes[index] = { ...routes[index], ...routeData };
          localStorage.setItem('routes', JSON.stringify(routes));
          return routes[index];
        }
        return null;
      },
    },
  },
  integrations: {
    Core: {
      UploadFile: async ({ file }) => {
        // Return a data URL for local development
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            resolve({ file_url: e.target.result });
          };
          reader.readAsDataURL(file);
        });
      },
    },
  },
};
