using System.Web.Mvc;

namespace StockVSGame.Controllers
{
    public partial class HomeController
    {
        [HttpGet]
        public ActionResult Index()
        {
            HomeIndexModel model = new HomeIndexModel();
            model.GetSetting();
            model.GetStockData();

            return View(model);
        }
    }
}