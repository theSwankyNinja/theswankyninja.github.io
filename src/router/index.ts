import { createRouter, createWebHistory } from 'vue-router'
import HomeView from "../views/HomeView.vue";
import MethodView from "../views/MethodView.vue";
import AboutView from "../views/AboutView.vue";
import ReportView from "../views/ReportView.vue";


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "default",
      component: HomeView,
    },
    {
      path: "/Home",
      name: "Home",
      component: HomeView,
    },
    {
      path: "/Methods",
      name: "Methods",
      component: MethodView,
    },
    {
      path: "/About",
      name: "About",
      component: AboutView,
    },    
    {
      path: "/Reports",
      name: "Reports",
      component: ReportView,
    },
  ]
})

export default router
