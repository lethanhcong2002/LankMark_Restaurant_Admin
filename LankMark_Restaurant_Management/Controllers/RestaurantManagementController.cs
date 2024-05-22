using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace LankMark_Restaurant_Management.Controllers
{
    public class RestaurantManagementController : Controller
    {
        // GET: RestaurantManagement
        public ActionResult Menu()
        {
            return View();
        }

        public ActionResult Storage()
        {
            return View();
        }

        public ActionResult AddToStorage()
        {
            return View();
        }

        public ActionResult AddToMenu()
        {
            return View();
        }

        public ActionResult SupplierManagement()
        {
            return View();
        }

        public ActionResult ImportProductManagement() 
        {
            return View();
        }
    }
}