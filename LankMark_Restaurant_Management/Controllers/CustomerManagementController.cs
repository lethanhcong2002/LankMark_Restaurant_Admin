using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace LankMark_Restaurant_Management.Controllers
{
    public class CustomerManagementController : Controller
    {
        // GET: CustomerManagement
        public ActionResult ListCustomer()
        {
            return View();
        }

        public ActionResult Feedback()
        {
            return View();
        }
    }
}