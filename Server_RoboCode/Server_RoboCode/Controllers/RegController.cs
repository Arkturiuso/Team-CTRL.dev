using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Server_RoboCode.Controllers
{
    public class RegController : Controller
    {
        // GET: RegController
        public ActionResult Index()
        {
            return View();
        }

        // GET: RegController/Details/5
        public ActionResult Details(int id)
        {
            return View();
        }

        // GET: RegController/Create
        public ActionResult Create()
        {
            return View();
        }

        // POST: RegController/Create
        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult Create(IFormCollection collection)
        {
            try
            {
                return RedirectToAction(nameof(Index));
            }
            catch
            {
                return View();
            }
        }

        // GET: RegController/Edit/5
        public ActionResult Edit(int id)
        {
            return View();
        }

        // POST: RegController/Edit/5
        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult Edit(int id, IFormCollection collection)
        {
            try
            {
                return RedirectToAction(nameof(Index));
            }
            catch
            {
                return View();
            }
        }

        // GET: RegController/Delete/5
        public ActionResult Delete(int id)
        {
            return View();
        }

        // POST: RegController/Delete/5
        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult Delete(int id, IFormCollection collection)
        {
            try
            {
                return RedirectToAction(nameof(Index));
            }
            catch
            {
                return View();
            }
        }
    }
}
