using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using System.Web;

namespace LankMark_Restaurant_Management.Models
{
    public class User
    {
        public String UserID { get; set; }
        public String Password { get; set; }
        public String FullName { get; set; }
        public String EmailAddress { get; set; }
        public String PhoneNumber { get; set; }
        public String UserType { get; set; }
        public double Salary { get; set; }
        public DateTime DateCreateAccount { get; set; }
        public Boolean IsActived { get; set; }
        public Image Avatar { get; set; }

        public User() { }
        public User(string userID, string password, string fullName, string emailAddress, string phoneNumber, string userType, double salary, DateTime dateCreateAccount, bool isActived, Image avatar)
        {
            UserID = userID;
            Password = password;
            FullName = fullName;
            EmailAddress = emailAddress;
            PhoneNumber = phoneNumber;
            UserType = userType;
            Salary = salary;
            DateCreateAccount = dateCreateAccount;
            IsActived = isActived;
            Avatar = avatar;
        }
    }
}