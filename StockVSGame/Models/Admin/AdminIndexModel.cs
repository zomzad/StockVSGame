using StockVSGame.Entity.Admin;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;
using System.Web.Script.Serialization;
using System.Xml;
using static StockVSGame.Entity.Admin.AdminIndexEntity;

namespace StockVSGame
{
    public class AdminIndexModel
    {
        #region - Definition -
        public class Tech
        {
            public List<string> Title = new List<string> { "日期", "股票代號", "股票名稱", "開盤價", "最高價", "最低價", "收盤價", "漲跌", "漲幅(%)", "成交量", "5MA", "20MA", "60MA", "K(9)", "D(9)", "RSI(5)", "RSI(10)", "DIF", "MACD", "DIF-MACD", "+DI(14)", "-DI(14)", "ADX(14)" };
            public List<List<List<string>>> Data = new List<List<List<string>>>();
        }

        public class StockInfo
        {
            public string IsChoose { get; set; }
            public string StockID { get; set; }
            public string Date { get; set; }
        }
        #endregion

        public AdminIndexModel()
        {
            _entity = new AdminIndexEntity("StockDB");
        }

        #region - Property -
        public string ErrMag { get; set; }
        public string TechJsonStr { get; set; }
        /// <summary>
        /// 移動鎖利機器人%數
        /// </summary>
        public int Percent { get; set; }
        public string OnOff { get; set; }

        public string IsRadom { get; set; }
        public string StockTotalNum { get; set; }
        public string SettingStockNum { get; set; }
        public string AddBackGroundPath { get; set; }
        public string ActivityUrl { get; set; }
        public string MkTContent { get; set; }
        public Tech TechData = new Tech();
        public List<StockInfo> StockInfoList { get; set; }
        #endregion

        #region - Private -
        private AdminIndexEntity _entity;
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
                GetStockData();
                return true;
            }
            catch (Exception e)
            {
                ErrMag = e.Message;
            }

            return false;
        }

        #region - 取得個股資料 -
        /// <summary>
        /// 取得個股資料
        /// </summary>
        /// <returns></returns>
        public bool GetStockData()
        {
            try
            {
                var dataList = StockInfoList.Where(n => n.IsChoose == "Y").ToList();
                List<List<Stock>> stockList = _entity.GetStockList(dataList);
                if (stockList.Any())
                {
                    StockTotalNum = stockList.Count.ToString();
                    MaCount(new List<int> { 20, 60 }, stockList[0]);//計算月線&季線

                    //轉換資料格式適合data.json使用
                    TechData.Data.AddRange(stockList.Select(n => n.Select(e =>
                    {
                        var propertyInfos = e.GetType().GetProperties();
                        return propertyInfos.Select(x => e.GetType().GetProperty(x.Name).GetValue(e, null).ToString())
                            .ToList();
                    }).ToList()).ToList());

                    TechJsonStr = new JavaScriptSerializer().Serialize(TechData);
                    var rootPath = HttpContext.Current.Server.MapPath("");
                    File.WriteAllText(rootPath + "\\Scripts\\data.json", TechJsonStr);
                }else if (string.IsNullOrWhiteSpace(_entity.errMag_entity) == false)
                {
                    ErrMag = _entity.errMag_entity;
                }

                return true;
            }
            catch (Exception e)
            {
                ErrMag = e.Message;
            }

            return false;
        }
        #endregion

        #region - 均線計算 -
        /// <summary>
        /// 均線計算
        /// </summary>
        /// <param name="dec"></param>
        /// <param name="day"></param>
        /// <param name="stockList"></param>
        public void MaCount(List<int> day, List<Stock> stockList)
        {
            try
            {
                var propNM = new Dictionary<string, string> { { "20", "月均線" }, { "60", "季均線" } };

                foreach (var num in day)
                {
                    int arrIndex = 0;
                    decimal avg = 0;
                    int up = arrIndex + num;
                    var closePrice = stockList.Select(n => decimal.Parse(n.收盤價)).ToArray();

                    for (int i = 0; i < closePrice.Length - num; i++)
                    {
                        for (arrIndex = i; arrIndex < up; arrIndex++)
                        {
                            avg += closePrice[arrIndex];
                        }

                        typeof(Stock).GetProperty(propNM[num.ToString()]).SetValue(stockList[up - 1], Math.Round((avg / (decimal)num), 2, MidpointRounding.AwayFromZero).ToString());
                        avg = 0;
                        up++;
                    }
                }
            }
            catch (Exception e)
            {
                Console.WriteLine(e);
                throw;
            }
        }
        #endregion
    }
}