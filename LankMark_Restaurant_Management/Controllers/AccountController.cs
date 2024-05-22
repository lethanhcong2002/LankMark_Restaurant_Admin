using LankMark_Restaurant_Management.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace LankMark_Restaurant_Management.Controllers
{
    public class AccountController : Controller
    {
        // GET: Account
        public ActionResult SignIn()
        {
            return View();
        }

        public ActionResult ForgotPassword()
        {
            return View();
        }    

        public ActionResult UserDetail()
        {
            return View();
        }

    }
}