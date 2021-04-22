using System.Web.Mvc;

namespace StockVSGame.Controllers
{
    public partial class HomeController
    {
        [HttpGet]
        public ActionResult Game()
        {
            HomeGameModel model = new HomeGameModel();
            model.GetSetting();

            return View(model);
        }
    }
}