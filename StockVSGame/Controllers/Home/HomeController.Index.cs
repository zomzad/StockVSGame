using System.Web.Mvc;

namespace StockVSGame.Controllers
{
    public partial class HomeController
    {
        [HttpGet]
        public ActionResult Index()
        {
            HomeIndexModel model = new HomeIndexModel();
            model.Init();

            return View(model);
        }
    }
}