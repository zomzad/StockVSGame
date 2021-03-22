using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Text;

namespace StockVSGame.Entity.Home
{
    public class HomeEntity : _BaseEntity
    {
        public HomeEntity(string id) : base(id)
        {

        }

        #region - 取得個股資訊清單 -
        public class Stock
        {
            public string 日期 { get; set; }
            public string 股票代號 { get; set; }
            public string 股票名稱 { get; set; }
            public string 開盤價 { get; set; }
            public string 最高價 { get; set; }
            public string 最低價 { get; set; }
            public string 收盤價 { get; set; }
            public string 漲跌 { get; set; }
            public string 漲跌比例 { get; set; }
            public string 成交量 { get; set; }
            public string 周均線 { get; set; }
            public string 月均線{ get; set; }
            public string 季均線 { get; set; }
            public string K { get; set; }
            public string D { get; set; }
            public string RSIA { get; set; }
            public string RSIB { get; set; }
            public string DIF { get; set; }
            public string MACD { get; set; }
            public string DMACD { get; set; }
            public string DIA { get; set; }
            public string DIB { get; set; }
            public string ADX { get; set; }
        }

        public List<List<Stock>> GetStockList()
        {
            DataTable tableRow = new DataTable();
            List<string> stockIDList = new List<string>();
            List<List<Stock>> stockInfoList = new List<List<Stock>>();

            var commandTextStock = new StringBuilder(string.Join(Environment.NewLine, new object[]
            {
                "SELECT TOP 1 股票代號",
                "  FROM 日收盤表排行",
                " WHERE LEN(股票代號) <= 4 AND 股票代號 = '3014'",
                " ORDER BY NEWID()"
            }));

            using (SqlConnection connection = new SqlConnection(_conn))
            {
                using (SqlCommand cmd = new SqlCommand(commandTextStock.ToString(), connection))
                {
                    connection.Open();
                    SqlDataAdapter adapter = new SqlDataAdapter(cmd);
                    using (SqlDataReader reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            stockIDList.Add(reader.GetString(0));
                        }
                    }
                }
            }

            foreach (var row in stockIDList)
            {
                var commandText = new StringBuilder(string.Join(Environment.NewLine, new object[]
                {
                    "SELECT TOP 220 日期",
                    "     , 股票代號",
                    "     , 股票名稱",
                    "     , 開盤價",
                    "     , 最高價",
                    "     , 最低價",
                    "     , 收盤價",
                    "     , 漲跌",
                    "     , [漲幅(%)] AS 漲跌比例",
                    "     , 成交量",
                    "     , '0' AS 周均線",
                    "     , '' AS 月均線",
                    "     , '' AS 季均線",
                    "     , '86.19' AS K",
                    "     , '86.12' AS D",
                    "     , '72.07' AS RSIA",
                    "     , '67.24' AS RSIB",
                    "     , '0.501' AS DIF",
                    "     , '0.478' AS MACD",
                    "     , '0.023' AS DMACD",
                    "     , '27.29' AS DIA",
                    "     , '18.98' AS DIB",
                    "     , '19.69' AS ADX",
                    "  FROM 日收盤表排行",
                    " WHERE 股票代號 = '"+ row +"' AND 日期 >= '20180101'",
                    " ORDER BY 日期 DESC"
                }));

                using (SqlConnection connection = new SqlConnection(_conn))
                {
                    using (SqlCommand cmd = new SqlCommand(commandText.ToString(), connection))
                    {
                        connection.Open();
                        SqlDataAdapter adapter = new SqlDataAdapter(cmd);
                        adapter.Fill(tableRow);
                    }
                }

                stockInfoList.Add(tableRow.ToList<Stock>().ToList());
                tableRow = new DataTable();
            }

            return stockInfoList;
        }
        #endregion
    }
}