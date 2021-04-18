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
        public int Percent { get; set; }
        public string IsRadom { get; set; }

        public List<StockInfo> StockInfoList { get; set; }
        #endregion

        public void test()
        {
            XmlDocument xmlDoc = new XmlDocument();
            xmlDoc.Load(HttpContext.Current.Server.MapPath("~/App_Data/Setting.xml"));
            var data = xmlDoc.SelectNodes("/Settings").Cast<XmlNode>().SingleOrDefault();

            XmlElement department = xmlDoc.CreateElement("STK");
            department.SetAttribute("股票代號", "1234");//設定屬性
            department.SetAttribute("起始日期", "2021-05-22");//設定屬性
            department.SetAttribute("選擇", "N");//設定屬性
            data.SelectSingleNode("StockInfo").RemoveAll();
            data.SelectSingleNode("StockInfo").AppendChild(department);


            xmlDoc.Save(HttpContext.Current.Server.MapPath("~/App_Data/Setting.xml"));
        }

        public void Init()
        {
            StockInfoList = new List<StockInfo>();
            XmlDocument xmlDoc = new XmlDocument();
            xmlDoc.Load(HttpContext.Current.Server.MapPath("~/App_Data/Setting.xml"));
            var data = xmlDoc.SelectNodes("/Settings").Cast<XmlNode>().SingleOrDefault();

            OnOff = data.SelectSingleNode("OnOff").InnerText;
            MkTContent = data.SelectSingleNode("MkTContent").InnerText;
            ActivityUrl = data.SelectSingleNode("ActivityUrl").InnerText;
            Percent = int.Parse(data.SelectSingleNode("Percent").InnerText);
            IsRadom = data.SelectSingleNode("IsRadom").InnerText;

            StockInfoList.AddRange(xmlDoc.SelectNodes("/Settings/StockInfo/STK").Cast<XmlNode>()
                .Select(n =>
                {
                    XmlElement datas = (XmlElement) n;
                    return new StockInfo
                    {
                        IsChoose = datas.GetAttribute("選擇"),
                        StockID = datas.GetAttribute("股票代號"),
                        Date = datas.GetAttribute("起始日期")
                    };
                }).ToList());

            if (StockInfoList.Count < 200)
            {
                int startIndex = StockInfoList.Count;
                for (int i = startIndex; i < 200; i++)
                {
                    StockInfoList.Add(new StockInfo
                    {
                        IsChoose = "N",
                        StockID = string.Empty,
                        Date = DateTime.Now.ToString("yyyy-MM-dd")
                    });
                }
            }
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
                data.SelectSingleNode("Percent").InnerText = Percent.ToString();
                data.SelectSingleNode("IsRadom").InnerText = IsRadom;
                data.SelectSingleNode("StockNum").InnerText = StockInfoList.Where(n => n.IsChoose == "Y").ToList().Count.ToString();
                data.SelectSingleNode("StockInfo").RemoveAll();

                foreach (var row in StockInfoList.Where(n => string.IsNullOrWhiteSpace(n.StockID) == false))
                {
                    XmlElement department = xmlDoc.CreateElement("STK");
                    department.SetAttribute("股票代號", row.StockID);
                    department.SetAttribute("起始日期", row.Date);
                    department.SetAttribute("選擇", row.IsChoose ?? "N");
                    data.SelectSingleNode("StockInfo").AppendChild(department);
                }

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