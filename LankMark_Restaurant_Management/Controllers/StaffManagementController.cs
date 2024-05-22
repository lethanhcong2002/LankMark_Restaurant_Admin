using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace LankMark_Restaurant_Management.Controllers
{
    public class StaffManagementController : Controller
    {
        // GET: StaffManagement
        public ActionResult AddNewStaff()
        {
            return View();
        }
        public ActionResult ListStaff()
        {
            return View();
        }
    }
}