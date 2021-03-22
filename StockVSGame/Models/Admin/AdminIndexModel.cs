using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Xml;

namespace StockVSGame
{
    public class AdminIndexModel
    {
        #region - Definition -

        public class StockInfo
        {
            public string IsChoose { get; set; }
            public string StockID { get; set; }
            public string Date { get; set; }
        }
        #endregion

        public AdminIndexModel()
        {

        }

        #region - Property -
        public string OnOff { get; set; }
        public string ActivityUrl { get; set; }
        public string MkTContent { get; set; }
        public int StockNum { get; set; }
        public int Percent { get; set; }
        public string IsRadom { get; set; }

        public List<StockInfo> StockInfoList { get; set; }
        #endregion

        public void Init()
        {
            if (StockInfoList == null || StockInfoList.Any() == false)
            {
                StockInfoList = new List<StockInfo>();
                for (int i = 0; i < 200; i++)
                {
                    StockInfoList.Add(new StockInfo
                    {
                        IsChoose = "N",
                        StockID = string.Empty,
                        Date = DateTime.Now.ToString("yyyy-MM-dd")
                    });
                }
            }

            XmlDocument xmlDoc = new XmlDocument();
            xmlDoc.Load(HttpContext.Current.Server.MapPath("~/App_Data/Setting.xml"));
            var data = xmlDoc.SelectNodes("/Settings").Cast<XmlNode>().SingleOrDefault();

            OnOff = data.SelectSingleNode("OnOff").InnerText;
            MkTContent = data.SelectSingleNode("MkTContent").InnerText;
            ActivityUrl = data.SelectSingleNode("ActivityUrl").InnerText;
            StockNum = int.Parse(data.SelectSingleNode("StockNum").InnerText);
            Percent = int.Parse(data.SelectSingleNode("Percent").InnerText);
            IsRadom = data.SelectSingleNode("IsRadom").InnerText;
        }

        public bool EditSettingXML()
        {
            try
            {
                XmlDocument xmlDoc = new XmlDocument();
                xmlDoc.Load(HttpContext.Current.Server.MapPath("~/App_Data/Setting.xml"));
                var data = xmlDoc.SelectNodes("/Settings").Cast<XmlNode>().SingleOrDefault();

                data.SelectSingleNode("OnOff").InnerText = OnOff;
                data.SelectSingleNode("MkTContent").InnerText = MkTContent;
                data.SelectSingleNode("ActivityUrl").InnerText = ActivityUrl;
                data.SelectSingleNode("StockNum").InnerText = StockNum.ToString();
                data.SelectSingleNode("Percent").InnerText = Percent.ToString();
                data.SelectSingleNode("IsRadom").InnerText = IsRadom;
                xmlDoc.Save(HttpContext.Current.Server.MapPath("~/App_Data/Setting.xml"));

                return true;
            }
            catch (Exception e)
            {
            }

            return false;
        }
    }
}