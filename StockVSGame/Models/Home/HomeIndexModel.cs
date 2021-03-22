﻿using StockVSGame.Entity.Home;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;
using System.Web.Script.Serialization;
using System.Xml;
using static StockVSGame.Entity.Home.HomeEntity;

namespace StockVSGame
{
    public class HomeIndexModel
    {
        public HomeIndexModel()
        {
            _entity = new HomeEntity("StockDB");
        }

        #region - Definition -

        public class Tech
        {
            public List<string> Title = new List<string>{ "日期", "股票代號", "股票名稱", "開盤價", "最高價", "最低價", "收盤價", "漲跌", "漲幅(%)", "成交量", "5MA", "20MA", "60MA", "K(9)", "D(9)", "RSI(5)", "RSI(10)", "DIF", "MACD", "DIF-MACD", "+DI(14)", "-DI(14)", "ADX(14)" };
            public List<List<List<string>>> Data = new List<List<List<string>>>();
        }
        #endregion

        #region - Property -
        public string TechJsonStr { get; set; }
        /// <summary>
        /// 移動鎖利機器人%數
        /// </summary>
        public int Percent { get; set; }
        public string OnOff { get; set; }
        public Tech TechData = new Tech();
        #endregion

        #region - Private -
        private HomeEntity _entity;
        #endregion

        #region - 取得個股資料 -
        /// <summary>
        /// 取得個股資料
        /// </summary>
        /// <returns></returns>
        public bool GetStockData()
        {
            try
            {
                List<List<Stock>> stockList = _entity.GetStockList();

                if (stockList.Any())
                {
                    MaCount(new List<int> { 20, 60 }, stockList[0]);//計算月線&季線

                    //轉換資料格式適合data.json使用
                    TechData.Data.AddRange(stockList.Select(n => n.Select(e =>
                    {
                        var propertyInfos = e.GetType().GetProperties();
                        return propertyInfos.Select(x => e.GetType().GetProperty(x.Name).GetValue(e, null).ToString())
                            .ToList();
                    }).ToList()).ToList());

                    TechJsonStr = new JavaScriptSerializer().Serialize(TechData);
                    var rootPath = System.Web.HttpContext.Current.Server.MapPath("./");
                    File.WriteAllText(rootPath + "Scripts\\data.json", TechJsonStr);
                }

                return true;
            }
            catch (Exception e)
            {
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
                var propNM = new Dictionary<string, string> { {"20", "月均線" }, {"60", "季均線"} };

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

        #region - 產生隨機日期 -
        /// <summary>
        /// 產生隨機日期
        /// </summary>
        public void GetRadomDate()
        {
            try
            {
                
            }
            catch (Exception e)
            {
                Console.WriteLine(e);
                throw;
            }
        }
        #endregion

        public void GetSetting()
        {
            XmlDocument xmlDoc = new XmlDocument();
            xmlDoc.Load(HttpContext.Current.Server.MapPath("~/App_Data/Setting.xml"));
            var data = xmlDoc.SelectNodes("/Settings").Cast<XmlNode>().SingleOrDefault();
            Percent = int.Parse(data.SelectSingleNode("Percent").InnerText);
            OnOff = data.SelectSingleNode("OnOff").InnerText;
        }
    }
}