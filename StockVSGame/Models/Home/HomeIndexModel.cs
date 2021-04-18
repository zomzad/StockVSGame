using StockVSGame.Entity.Home;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;
using System.Web.Script.Serialization;
using System.Xml;
using static StockVSGame.Entity.Home.HomeGameEntity;

namespace StockVSGame
{
    public class HomeIndexModel
    {
        public HomeIndexModel()
        {
            
        }

        public string AddBackGroundPath { get; set; }

        public void Init()
        {
            var path = string.Empty;
            if (HttpContext.Current.Request.Url.Host.Contains("localhost"))
            {
                path = string.Empty; 
            }
            else if (HttpContext.Current.Request.Url.Host.Contains("vmjsmarket"))
            {
                path = "StockVSRobot/";
            }
            else if(HttpContext.Current.Request.Url.Host.Contains("34"))
            {
                path = string.Empty;
            }

            AddBackGroundPath = "../" + path + "Content/img/black-carbon.jpg";
        }
    }
}