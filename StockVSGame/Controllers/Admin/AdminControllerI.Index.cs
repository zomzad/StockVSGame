using System.Web.Mvc;

namespace StockVSGame.Controllers
{
    public partial class AdminController
    {
        // GET: AdminIndex
        public ActionResult Index(AdminIndexModel model)
        {
            if (Request.RequestType == "GET")
            {
                model.Init();
            }
            else
            {
                if (model.EditSettingXML() == false)
                {

                }
            }

            return View(model);
        }
    }
}