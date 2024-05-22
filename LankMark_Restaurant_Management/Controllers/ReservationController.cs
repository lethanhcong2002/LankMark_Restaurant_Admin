using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace LankMark_Restaurant_Management.Controllers
{
    public class ReservationController : Controller
    {
        // GET: Reservation
        public ActionResult ListReservationScreen()
        {
            return View();
        }

        public ActionResult OrderFood()
        {
            return View();
        }
    }
}